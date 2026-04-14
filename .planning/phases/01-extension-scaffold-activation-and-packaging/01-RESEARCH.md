# Phase 1: Extension scaffold, activation, and packaging - Research

**Researched:** 2026-04-14  
**Domain:** VS Code / Cursor extension manifest, activation, esbuild bundling, vsce packaging  
**Confidence:** HIGH (official VS Code docs + npm registry probes for this session)

## User Constraints

No phase-specific `CONTEXT.md` exists (discuss-phase was skipped for this phase). Locked UX/product choices live in `.planning/PROJECT.md`, `.planning/REQUIREMENTS.md`, and `.planning/ROADMAP.md` — the planner must still honor **EXT-*** / **QUAL-*** IDs scoped to Phase 1.

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| EXT-01 | **Cleanup Branches** command discoverable in Command Palette with clear title and **Git** category | `contributes.commands` with `title` and `category`; Command Palette prefixes with category [CITED: https://code.visualstudio.com/api/references/contribution-points#contributescommands] |
| EXT-02 | **Lazy** activation — command and/or workspace git presence; **not** `*` | `onCommand`, `workspaceContains`; avoid `*` (documented as last resort) [CITED: https://code.visualstudio.com/api/references/activation-events] |
| EXT-03 | `extensionDependencies`: **`vscode.git`** | `extensionDependencies` array in manifest [CITED: https://code.visualstudio.com/api/references/extension-manifest] |
| EXT-04 | Toolchain: **typecheck + bundle + package**; `engines.vscode` aligned with `@types/vscode` | Official esbuild recipe: `tsc --noEmit` + esbuild; `vscode:prepublish` → `vsce package` [CITED: https://code.visualstudio.com/api/working-with-extensions/bundling-extension] [CITED: https://code.visualstudio.com/api/working-with-extensions/publishing-extension]; vsce/types alignment [CITED: https://github.com/microsoft/vscode-vsce/issues/455] |
| QUAL-02 | README: **supported editors** (VS Code + Cursor) and **minimum version** expectations | `engines.vscode` documents API/host floor; README should state VS Code compatibility and that **Cursor** is a VS Code fork (test on target Cursor build) [ASSUMED] — Cursor does not publish a separate npm `@types`; parity is best-effort vs declared `engines` |

</phase_requirements>

## Project Constraints (from .cursor/rules/)

**None** — `.cursor/rules/` is not present in this repository. Additional guidance appears in repo-root `CLAUDE.md` (GSD workflow, stack echo from `.planning/research/STACK.md`).

## Summary

Phase 1 establishes a **loadable, packageable** VS Code extension: correct `package.json` **contributions** (commands, activation, Git dependency), a **single bundled entry** (`main` → `dist/extension.js`), **separate typechecking** from the bundler, and **vsce**-driven VSIX creation. Official guidance treats **esbuild** as the default desktop pattern: `platform: 'node'`, `format: 'cjs'`, **`external: ['vscode']`**, plus **`tsc --noEmit`** because esbuild does not typecheck [CITED: https://code.visualstudio.com/api/working-with-extensions/bundling-extension].

Activation must stay **lazy**: combine **`onCommand:<yourCommandId>`** with optional **`workspaceContains:**/.git`** so the host does not use universal **`"`\*`"`** startup activation [CITED: https://code.visualstudio.com/api/references/activation-events]. Note: from **VS Code 1.74.0**, contributed commands can activate the extension **without** an explicit matching `onCommand` entry [CITED: same doc]; keeping an explicit `onCommand` (and/or `workspaceContains`) still satisfies EXT-02 and makes intent obvious in code review.

**Primary recommendation:** Scaffold with **esbuild + `tsc --noEmit` + `@vscode/vsce`**, manifest **`extensionDependencies`: `["vscode.git"]`**, **`contributes.commands`** entry with **`category`: `Git`** and title **Cleanup Branches**, **`activationEvents`** listing **`onCommand:`** (and optionally **`workspaceContains:**/.git**), **`vscode:prepublish`** wired to production bundle, and README stating **VS Code + Cursor** plus the **`engines.vscode`** meaning.

## Standard Stack

### Core

| Library | Version (verified 2026-04-14) | Purpose | Why Standard |
|---------|-------------------------------|---------|----------------|
| **VS Code API** | `engines.vscode`: caret range you choose (e.g. `^1.96.0`) | Extension host | Declares minimum API/host [CITED: https://code.visualstudio.com/api/references/extension-manifest] |
| **`@types/vscode`** | **1.115.0** [VERIFIED: npm registry] | Typings for `vscode` module | Must align with `engines.vscode`; vsce enforces relationship [CITED: https://github.com/microsoft/vscode-vsce/issues/455] |
| **TypeScript** | **6.0.2** [VERIFIED: npm registry] | `tsc --noEmit` | Official bundling doc requires separate typecheck [CITED: bundling-extension] |
| **esbuild** | **0.28.0** [VERIFIED: npm registry] | Bundle `src/extension.ts` → `dist/extension.js` | Official sample configuration [CITED: bundling-extension] |

### Supporting

| Library | Version (verified 2026-04-14) | Purpose | When to Use |
|---------|-------------------------------|---------|-------------|
| **`@vscode/vsce`** | **3.7.1** [VERIFIED: npm registry] | `vsce package` / publish | Required for VSIX / Marketplace [CITED: publishing-extension] |
| **`npm-run-all`** | (pin at `npm init`) | Parallel `tsc --watch` + `esbuild --watch` | Official esbuild sample [CITED: bundling-extension] |
| **`@vscode/test-cli`** | **0.0.12** [VERIFIED: npm registry] | Extension Host tests | Phase 1 may only add skeleton; full use in later phases [CITED: https://code.visualstudio.com/api/working-with-extensions/testing-extension] |
| **`@vscode/test-electron`** | **2.5.2** [VERIFIED: npm registry] | Test runner host | Pairs with test-cli |
| **mocha** | **11.7.5** [VERIFIED: npm registry] | Assertions in EH tests | Test CLI uses Mocha [CITED: testing-extension] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| esbuild (desktop) | webpack + `webworker` | Required for **vscode.dev** / web Extension Host single-file constraint [CITED: bundling-extension] — **out of scope v1** per `.planning/research/STACK.md` |
| `extensionDependencies` | Hope user has Git enabled | Fails EXT-03; unreliable |

**Installation (illustrative — pin in implementation):**

```bash
npm install -D typescript@6.0.2 @types/vscode@"^<match engines>" esbuild@0.28.0 @vscode/vsce@3.7.1 npm-run-all
```

**Version verification:** Session probes: `typescript@6.0.2`, `@types/vscode@1.115.0`, `@vscode/vsce@3.7.1`, `esbuild@0.28.0`, `@vscode/test-cli@0.0.12`, `@vscode/test-electron@2.5.2`, `mocha@11.7.5` [VERIFIED: npm registry]. Re-run `npm view <pkg> version` before freezing `package.json`.

## Architecture Patterns

### Recommended project layout

```
.
├── package.json          # contributes, activationEvents, engines, scripts
├── tsconfig.json
├── esbuild.js            # or inline npm script — official sample uses esbuild.js
├── src/
│   └── extension.ts      # activate(), registerCommand, exports
├── dist/
│   └── extension.js      # bundled output; package.json "main"
├── .vscodeignore         # exclude src, dev files; include dist
└── README.md             # QUAL-02
```

### Pattern 1: Command + palette discoverability (EXT-01)

**What:** Contribute a command with stable `command` id, human **`title`**, and **`category": "Git"`** so the palette shows **Git: …** grouping.

**When:** Always for this product.

**Example:**

```json
// Source: https://code.visualstudio.com/api/references/contribution-points#contributescommands
"contributes": {
  "commands": [
    {
      "command": "branchCleaner.cleanupBranches",
      "title": "Cleanup Branches",
      "category": "Git"
    }
  ]
}
```

### Pattern 2: Lazy activation (EXT-02)

**What:** Declare `activationEvents` that fire on **user intent** or **repo presence**, not on every window start.

**When:** Always; never use `"*"` unless no other combination works [CITED: activation-events].

**Example:**

```json
// Source: https://code.visualstudio.com/api/references/activation-events
"activationEvents": [
  "onCommand:branchCleaner.cleanupBranches",
  "workspaceContains:**/.git"
]
```

### Pattern 3: Typecheck + bundle + package (EXT-04)

**What:** `check-types` → `tsc --noEmit`; `compile` chains check + esbuild; `vscode:prepublish` runs production bundle before `vsce package`.

**When:** All publishable extensions using esbuild [CITED: bundling-extension].

**Example `scripts` (from official doc):**

```json
// Source: https://code.visualstudio.com/api/working-with-extensions/bundling-extension
"scripts": {
  "compile": "npm run check-types && node esbuild.js",
  "check-types": "tsc --noEmit",
  "vscode:prepublish": "npm run package",
  "package": "npm run check-types && node esbuild.js --production"
}
```

**esbuild core options (from official sample):** `bundle: true`, `format: 'cjs'`, `platform: 'node'`, `outfile: 'dist/extension.js'`, `external: ['vscode']` [CITED: bundling-extension].

### Pattern 4: Git extension dependency (EXT-03)

**What:** Top-level **`extensionDependencies`** including **`vscode.git`**.

**Example:**

```json
// Source: https://code.visualstudio.com/api/references/extension-manifest
"extensionDependencies": [
  "vscode.git"
]
```

### Anti-patterns to avoid

- **`*` activation:** Slows startup; official doc warns to use only when nothing else works [CITED: activation-events].
- **esbuild-only “compile”:** Types silently ignored [CITED: bundling-extension].
- **`@types/vscode` newer than `engines` allows:** Packaging / false API sense [CITED: vsce#455].
- **`main` pointing at `src/*.ts`:** Runtime cannot execute TS; `main` must be emitted/bundled JS [ASSUMED] — standard extension anatomy.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| VSIX / marketplace rules | Custom zip scripts | **`@vscode/vsce`** | Enforces manifest, ignores per `.vscodeignore`, PAT flow for publish [CITED: publishing-extension] |
| Bundling | Hand-concat files | **esbuild** (or webpack for web) | Maintained official samples [CITED: bundling-extension] |
| Command discovery | Only `registerCommand` without `contributes` | **`contributes.commands`** | Palette listing requires contribution [CITED: contribution-points] |

**Key insight:** Phase 1 should **compose** official manifest + bundling + vsce paths, not invent packaging.

## Common Pitfalls

### Pitfall 1: `.vscodeignore` excludes the bundle

**What goes wrong:** `vsce package` produces a VSIX that **omits `dist/`**; extension fails at activation.

**Why:** `.vscodeignore` patterns too broad (e.g. `**/*.js`).

**How to avoid:** Ensure `dist/extension.js` is **not** ignored; ignore `src/`, `esbuild.js`, `tsconfig.json`, tests per official sample [CITED: bundling-extension].

**Warning signs:** Smaller-than-expected VSIX; `Activation extension failed` referencing missing file.

### Pitfall 2: `engines.vscode` / `@types/vscode` mismatch

**What goes wrong:** `vsce` errors or extension uses APIs not in older hosts.

**Why:** Types advertise APIs above declared engine range.

**How to avoid:** Set **`engines.vscode`** first, then **`@types/vscode`** to same generation [CITED: vsce#455] [CITED: extension-manifest].

### Pitfall 3: Implicit activation confusion (1.74+)

**What goes wrong:** Team assumes `activationEvents` is redundant and deletes it; older docs/tools disagree.

**Why:** Behavior changed in 1.74 for contributed commands [CITED: activation-events].

**How to avoid:** Keep **explicit** `onCommand` / `workspaceContains` for EXT-02 clarity regardless of implicit behavior.

### Pitfall 4: Wrong built-in extension id for Git

**What goes wrong:** `extensionDependencies` typo → Git API unavailable at runtime.

**Why:** Id must be exactly **`vscode.git`** [CITED: extension-manifest field description + product convention].

## Code Examples

### `activate` registers the contributed command

```typescript
// Source pattern: VS Code extension API + contribution id alignment
// [CITED: https://code.visualstudio.com/api/get-started/your-first-extension] (conceptual; same model as samples)
import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerCommand('branchCleaner.cleanupBranches', async () => {
      await vscode.window.showInformationMessage('Branch Cleaner: scaffold OK');
    })
  );
}

export function deactivate(): void {}
```

### esbuild watch + tsc watch (development)

Use **`npm-run-all -p watch:esbuild watch:tsc`** as in official bundling doc [CITED: bundling-extension].

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `vscode/bin/compile` | **esbuild** + **`tsc --noEmit`** | Official doc prioritizes esbuild sample | Faster builds; two-step type safety [CITED: bundling-extension] |
| Global `vsce` | **`@vscode/vsce`** scoped package | Publishing doc | Prefer local devDependency + `npx` [CITED: publishing-extension] |

**Deprecated/outdated:**

- Relying on **esbuild alone** for type safety — still invalid [CITED: bundling-extension].

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|----------------|
| A1 | **Cursor** users can install the same VSIX / use F5 workflow and that stating “compatible with VS Code `engines` range” is sufficient alongside a sentence naming Cursor | QUAL-02 / Summary | Cursor lag on API could surface rare API gaps — mitigate by testing on a representative Cursor version |
| A2 | Marketplace **`categories`** value for this product can be **`SCM Providers`** or **`Other`** without affecting EXT-01 (palette category is `commands[].category`, not Marketplace `categories`) | Architecture | Low — cosmetic marketplace grouping only |

**If CONTEXT existed:** Locked decisions would be copied verbatim under `<user_constraints>`.

## Open Questions (RESOLVED)

1. **Exact `engines.vscode` minimum (e.g. 1.96 vs 1.85)?** — **RESOLVED:** Phase 1 plans lock **`engines.vscode`: `^1.96.0`** with **`@types/vscode`: `^1.96.0`** (same major.minor line). README (QUAL-02) documents that floor; bump both together when raising the minimum.

2. **`extensionKind` for Remote SSH?** — **RESOLVED (deferred):** Not in Phase 1 scope. Ship with default `extensionKind` behavior only; open a future phase or backlog item if Remote SSH / split extension-host issues appear once Git API wiring lands.

## Environment Availability

**Step 2.6:** Dependencies — Node for build/package; VS Code or Cursor for smoke; Git binary not required for **Phase 1** noop command but required for real-world manual test with `.git`.

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Node.js | npm, esbuild, vsce | ✓ | v22.11.0 (session) | Use 20.x+ LTS per STACK.md |
| npm | scripts | ✓ | 10.9.0 | — |
| `code` / `cursor` CLI | Manual install VSIX | Not probed | — | Use Extensions view “Install from VSIX” [CITED: publishing-extension] |

**Missing dependencies with no fallback:** None for writing scaffold; publishing to Marketplace needs Azure DevOps PAT (out of scope for local VSIX).

## Validation Architecture

> Nyquist validation is **enabled** in `.planning/config.json` (`workflow.nyquist_validation: true`).

### Test framework (Phase 1 scope)

| Property | Value |
|----------|-------|
| Framework | **@vscode/test-cli** + **@vscode/test-electron** + **Mocha** (versions verified this session) [VERIFIED: npm] [CITED: https://code.visualstudio.com/api/working-with-extensions/testing-extension] |
| Config file | `.vscode-test.mjs` or equivalent (create in Wave 0 if not present) [ASSUMED] — follow current `@vscode/test-cli` sample for repo |
| Quick run command | `npm run compile` (typecheck + bundle) |
| Full suite command | `npm run compile && npx @vscode/test-electron` / `vscode-test` script when wired [ASSUMED exact script name] |

### Nyquist-style dimensions (what “done” means for Phase 1)

| Dimension | Verify | Evidence |
|-----------|--------|----------|
| **D1 — Installability** | `vsce package` succeeds; VSIX installs in VS Code/Cursor | CI or local: artifact + install |
| **D2 — Activation** | Extension does not activate at idle incorrectly; activates on command and/or workspace with `.git` | Debugger / log line in `activate()`; manual |
| **D3 — Contribution** | Command appears as **Git: Cleanup Branches** (or equivalent **Git** category prefix) | Command Palette screenshot / manual |
| **D4 — Dependency** | With `vscode.git` present, extension activates; document behavior if Git extension disabled | Manual (full Git UX is Phase 2) |
| **D5 — Build hygiene** | `tsc --noEmit` clean; production bundle runs on `vscode:prepublish` | `npm run compile`, `npm run package` |
| **D6 — Docs** | README states VS Code + Cursor + engine meaning | Doc review (QUAL-02) |

### Phase requirements → test map

| Req ID | Behavior | Test type | Automated command | File exists? |
|--------|----------|-----------|-------------------|--------------|
| EXT-04 | Typecheck + bundle | script | `npm run compile` | ❌ Wave 0 — create `package.json` scripts |
| EXT-01 / EXT-02 / EXT-03 | Palette + activation + dependency | integration / manual | `vscode-test` minimal “extension activated” test **or** documented manual checklist | ❌ Wave 0 |
| QUAL-02 | README accuracy | manual / review | `rg "Cursor|VS Code|engines" README.md` | ❌ Wave 0 |

### Sampling rate

- **Per task commit:** `npm run compile`
- **Per wave merge:** `npm run compile` + (when present) minimal `vscode-test`
- **Phase gate:** VSIX built; manual smoke in VS Code **and** Cursor per QUAL-02 intent

### Wave 0 gaps

- [ ] Initialize `package.json`, `tsconfig.json`, `esbuild.js`, `src/extension.ts`, `.vscodeignore`
- [ ] Add minimal Extension Host test or explicit **manual verification checklist** in PLAN for EXT-01–03 if tests deferred
- [ ] Add README section for QUAL-02

## Security Domain

Phase 1 is **scaffold only** (no network, no secrets, no user data). Applicable controls are minimal.

### Applicable ASVS categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-------------------|
| V2 Authentication | no | — |
| V3 Session Management | no | — |
| V4 Access Control | no | — |
| V5 Input Validation | low | No user input beyond command invocation; keep future inputs validated |
| V6 Cryptography | no | — |

### Known threat patterns

| Pattern | STRIDE | Mitigation |
|---------|--------|------------|
| Malicious VSIX sideload | Spoofing | Distribute only from trusted repo/releases; Marketplace PAT hygiene when publishing [CITED: publishing-extension] |

## Sources

### Primary (HIGH)

- [Activation Events](https://code.visualstudio.com/api/references/activation-events) — `onCommand`, `workspaceContains`, warning on `*` [CITED]
- [Extension Manifest](https://code.visualstudio.com/api/references/extension-manifest) — `engines`, `extensionDependencies`, `main` [CITED]
- [Contribution Points — commands](https://code.visualstudio.com/api/references/contribution-points#contributescommands) — `title`, `category` [CITED]
- [Bundling Extensions](https://code.visualstudio.com/api/working-with-extensions/bundling-extension) — esbuild, `tsc --noEmit`, `vscode:prepublish`, `.vscodeignore` [CITED]
- [Publishing Extensions](https://code.visualstudio.com/api/working-with-extensions/publishing-extension) — `@vscode/vsce`, `vsce package`, VSIX install [CITED]
- [npm registry `npm view`](session 2026-04-14) — package versions listed in Standard Stack [VERIFIED: npm registry]

### Secondary (MEDIUM)

- [vscode-vsce#455](https://github.com/microsoft/vscode-vsce/issues/455) — `@types/vscode` vs `engines.vscode` [CITED]

### Tertiary (LOW)

- Cursor-specific compatibility beyond “VS Code fork” — confirm on target installs [ASSUMED].

## Metadata

**Confidence breakdown:**

- Standard stack: **HIGH** — official docs + npm probes
- Architecture: **HIGH** — manifest + esbuild sample are prescriptive
- Pitfalls: **MEDIUM** — `.vscodeignore` and remote `extensionKind` need execution-time check

**Research date:** 2026-04-14  
**Valid until:** ~2026-05-14 (re-verify npm majors after 30 days)
