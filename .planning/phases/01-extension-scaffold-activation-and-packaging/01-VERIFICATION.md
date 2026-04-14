---
phase: 01-extension-scaffold-activation-and-packaging
verified: 2026-04-14T15:30:00Z
status: passed
score: 5/5
overrides_applied: 0
---

# Phase 1: Extension scaffold, activation, and packaging — verification report

**Phase goal:** The extension installs and activates predictably in VS Code/Cursor, exposes a discoverable **Cleanup Branches** command, declares the Git extension dependency, and documents supported hosts and build expectations.

**Verified:** 2026-04-14T15:30:00Z  
**Status:** passed  
**Re-verification:** No — initial verification (no prior `*-VERIFICATION.md` in this phase directory).

## Goal achievement

### Observable truths (ROADMAP success criteria)

| # | Truth (success criterion) | Status | Evidence |
|---|---------------------------|--------|----------|
| 1 | User can find **Cleanup Branches** under a Git-oriented title/category via Command Palette | ✓ VERIFIED | `package.json` `contributes.commands`: `title` `Cleanup Branches`, `category` `Git`, `command` `branchCleaner.cleanupBranches` — VS Code surfaces this as **Git: Cleanup Branches**. |
| 2 | Extension does not use universal `*` activation; activation is Git-aware / command-driven | ✓ VERIFIED | `activationEvents`: `onCommand:branchCleaner.cleanupBranches`, `workspaceContains:**/.git`; `node -e` check confirms no `*` entry. |
| 3 | `extensionDependencies` includes `vscode.git` so activation does not miss Git API wiring | ✓ VERIFIED | `"extensionDependencies": ["vscode.git"]` in `package.json`. |
| 4 | Maintainer can typecheck, bundle, and produce a VSIX; `engines.vscode` aligned with API typings | ✓ VERIFIED | `npm run compile` exit 0 (`check-types` + `esbuild.js` → `dist/extension.js`). `engines.vscode` `^1.96.0` with `@types/vscode` `~1.96.0` (same 1.96 API line). `npx @vscode/vsce@3.7.1 package -o /tmp/vscode-branch-cleaner-verify.vsix` exit 0; VSIX lists `dist/extension.js`. |
| 5 | README explains VS Code + Cursor targets and minimum editor / API expectations | ✓ VERIFIED | `README.md` names Visual Studio Code and Cursor, explains `engines.vscode` as minimum API version and Cursor as a fork. |

**Score:** 5/5 roadmap success criteria verified.

### Plan must-haves (01-PLAN + 02-PLAN)

Plan-level checks align with the table above. Artifact scan via `gsd-tools verify artifacts` for both plans: **all_passed: true** for declared paths.

**Note:** `gsd-tools verify key-links` reported `verified: false` for both plans (e.g. “Source file not found” / “Target not referenced in source”) — treated as **tool false negatives**; manual checks confirm:

- `package.json` command id ↔ `src/extension.ts` `registerCommand('branchCleaner.cleanupBranches', …)` — same string.
- `onCommand:branchCleaner.cleanupBranches` matches contributed command id.
- `README.md` documents `npm run compile`, `npm run package`, `npm run watch`, and `npx --yes @vscode/vsce@3.7.1 package …` — keys match `package.json` `scripts` / documented packaging flow.

**Minor plan delta:** `01-PLAN.md` text specified `@types/vscode@^1.96.0`; repo uses `~1.96.0`. Same **1.96** API generation as `engines.vscode` — acceptable for EXT-04 / vsce alignment.

### Required artifacts

| Artifact | Expected | Status | Details |
| -------- | -------- | ------ | ------- |
| `package.json` | Manifest, scripts, contributes, activation, `vscode.git` | ✓ VERIFIED | Present; `main` → `./dist/extension.js`. |
| `esbuild.js` | Bundle with `external: ['vscode']` | ✓ VERIFIED | CJS, `dist/extension.js`, production minify flag. |
| `src/extension.ts` | `activate` / `deactivate`, registered command | ✓ VERIFIED | Registers command; pushes subscription. |
| `dist/extension.js` | Built output after compile | ✓ VERIFIED | Produced by `npm run compile` (56 lines in current build). |
| `README.md` | QUAL-02 + build/packaging | ✓ VERIFIED | Editors, `engines.vscode`, compile/package/watch, VSIX command. |
| `.vscodeignore` | Ship bundle; drop dev noise | ✓ VERIFIED | Excludes `src/**`, tooling, `.planning/**`; **no** rule dropping `dist/` (no non-comment line starting with `dist`). |
| `.gitignore` | `node_modules`, `dist`, `*.vsix` | ✓ VERIFIED | Present. |

### Key link verification (manual)

| From | To | Via | Status | Details |
| ---- | -- | --- | ------ | ------- |
| `package.json` contributes command | `src/extension.ts` | Same command id string | ✓ WIRED | `branchCleaner.cleanupBranches` |
| `package.json` activationEvents | contributes.commands | `onCommand:` prefix | ✓ WIRED | Matches command id |
| `README.md` | `package.json` scripts | Documented npm script names | ✓ WIRED | `compile`, `package`, `watch` |

### Data-flow trace (level 4)

Not applicable for this phase: no dynamic data-bound UI beyond a static scaffold message.

### Behavioral spot-checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| Typecheck + bundle | `npm run compile` (repo root) | Exit **0** | ✓ PASS |
| VSIX packaging | `npx --yes @vscode/vsce@3.7.1 package -o /tmp/vscode-branch-cleaner-verify.vsix` | Packaged; manifest lists `dist/extension.js` | ✓ PASS |

### Requirements coverage (phase 1)

| Requirement | Description | Status | Evidence |
| ------------- | ----------- | ------ | -------- |
| EXT-01 | Cleanup Branches in palette, Git category | ✓ SATISFIED | `contributes.commands` |
| EXT-02 | Lazy activation | ✓ SATISFIED | `onCommand` + `workspaceContains:**/.git`, no `*` |
| EXT-03 | `extensionDependencies` → `vscode.git` | ✓ SATISFIED | `package.json` |
| EXT-04 | Typecheck + bundle + package path, engines/types | ✓ SATISFIED | Scripts, compile + vsce, `engines` / `@types` |
| QUAL-02 | README: editors + minimum expectations | ✓ SATISFIED | `README.md` |

No orphaned phase-1 requirements in `REQUIREMENTS.md` (all listed IDs appear in plan frontmatter).

### Anti-patterns

| File | Pattern | Severity | Notes |
| ---- | ------- | -------- | ----- |
| — | — | — | No blocking TODO/FIXME/placeholder-only handlers in `src/extension.ts`; scaffold message is intentional. |

### Gaps summary

None. Phase 1 goal is met in the repository as verified.

---

_Verified: 2026-04-14T15:30:00Z_  
_Verifier: Claude (gsd-verifier)_
