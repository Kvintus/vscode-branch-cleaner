# Project Research Summary

**Project:** VS Code Branch Cleaner  
**Domain:** VS Code / Cursor extension — local Git branch cleanup (gitcleaner-style workflow)  
**Researched:** 2026-04-14  
**Confidence:** MEDIUM (stack/architecture: HIGH; features: MEDIUM; pitfalls: MEDIUM — several edges need fixture validation)

## Executive Summary

This product is a **standard VS Code extension** that should lean on **official patterns**: bundle with **esbuild** (`external: ['vscode']`, `platform: 'node'`), keep **`engines.vscode` aligned with `@types/vscode`**, run **`tsc --noEmit`** beside the bundler, and integrate Git through the **built-in `vscode.git` extension API** (`getAPI(1)`), with **`extensionDependencies: ["vscode.git"]`**. Experts keep **commands thin**, put gitcleaner rules and merge policy in a **testable application layer**, and hide Git behind a **`GitRepositoryPort`** implemented by a **`VscodeGitRepositoryAdapter`**.

The recommended product shape is **one palette command** (“Cleanup Branches”), **multi-select QuickPick** (explicit pick → act), **candidates** filtered by upstream/gitcleaner-style rules, **merge state vs a single resolved baseline** (prefer **`origin/HEAD`** with **documented fallbacks** and **visible label** in UI), and **local `deleteBranch` only** for v1. **Non-merged** selections must match the **same baseline** as the list (block, strong confirm, or refuse — never contradict labels).

Main risks are **wrong merge baseline or predicate** (data loss narrative), **stale/missing `origin/HEAD`**, **worktrees**, **shallow clones**, **ambiguous refs**, and **races with concurrent Git**. Mitigate with: one resolved integration ref per run, **ancestor-style** merge checks, **full refnames**, **pre-delete re-checks**, **shallow detection + conservative policy + UI banner**, **worktree awareness or clear errors**, **argv-only Git spawns** when CLI is needed, and **aggregated delete results** (no silent partial success).

## Key Findings

### Recommended Stack

Ship a **desktop-first** extension: **TypeScript 5.9+/6.x**, **esbuild ~0.28** to `dist/extension.js`, **`tsc --noEmit`** in compile/package scripts, **`@vscode/vsce`** for packaging, **`@vscode/test-cli` + `@vscode/test-electron` + Mocha** for Extension Host tests, optional **Vitest** only for pure logic. Declare a deliberate **`engines.vscode`** range and match **`@types/vscode`** to it (vsce enforces this). Prefer **`vscode.git`** over raw `git` for list/upstream/merge-base/delete; add **narrow CLI fallback** only for documented gaps.

**Core technologies:**

- **VS Code API + aligned `@types/vscode`** — contract with the host; mismatches break publish/runtime assumptions.
- **esbuild + `tsc --noEmit`** — fast bundle; esbuild does not typecheck.
- **`vscode.git` (`getAPI(1)`)** — same Git abstraction as the editor; `Repository` for branches, upstream, `getMergeBase`, `deleteBranch`.
- **`@vscode/test-cli` / Mocha** — supported integration-test path; do not make Vitest the only host-level runner.

### Expected Features

**Must have (table stakes):**

- **Command palette entry** (“Cleanup Branches”, clear category) — discoverability.
- **gitcleaner-style candidate discovery** + **exclude current branch** — core promise; document rules in UI.
- **Merged / not merged vs `origin/HEAD`** (with **named fallback** in UI when symref missing) — trust and parity with product decision.
- **Multi-select QuickPick** — review → pick → act; dismiss = no-op.
- **Non-merged safety** — consistent with list baseline; no silent delete of unsafe selections.
- **Clear errors** — invalid repo, Git missing, failures surfaced via notifications/messages.

**Should have (competitive):**

- **Named merge baseline in UI**, **settings** (`defaultRemote`, optional baseline override), **“upstream gone”** as a visible signal, optional **dry-run summary** / **createQuickPick** polish after core works.

**Defer (v2+):**

- **Remote deletion**, **auto cleanup on open/fetch**, **full JetBrains edge-case parity** before ship, **non-Git VCS**, in-app “undo” beyond prevention + reflog guidance.

### Architecture Approach

**Layering:** `package.json` contributions → thin **`extension.ts`** → **command handlers** → **`BranchCleanupApplicationService`** (rules, gating, delete plan) → **`GitRepositoryPort`** → **`VscodeGitRepositoryAdapter`** (`vscode.git`). UI builds QuickPick rows from DTOs; **no business rules or `deleteBranch` in UI callbacks**. Lazy activation: **`onCommand`** + **`workspaceContains:**/.git**`; avoid `*`. Use **`getRepository` / `openRepository`** and handle Git disabled / null repo. Prefer **QuickPick** over webview for v1.

**Major components:**

1. **Manifest / activation** — engines, commands, optional settings, `vscode.git` dependency.
2. **Application service** — candidates, baseline resolution, merge classification, safety policy, orchestration (unit-testable with fake port).
3. **Git port + VS Code adapter** — branch list, upstream, refs, merge-base, delete; typed errors upward.
4. **UI module** — QuickPick construction, progress/cancellation threading.

### Critical Pitfalls

1. **Wrong merge baseline or predicate** — single resolved integration ref per run; ancestor semantics; re-check before delete; document squash/rebase expectation gap in copy.
2. **Missing/stale `origin/HEAD`** — symref + ordered fallbacks + settings; always show **“compared against: …”** in UI; local-first resolution (avoid network hangs).
3. **Worktrees** — branch may be HEAD elsewhere; preflight or clear `stderr`-driven messaging; never imply silent success.
4. **Shallow clones** — detect and **degrade** (banner, conservative “merged” policy); do not over-claim confidence.
5. **Ambiguous refs / Windows casing** — carry **`refs/heads/...`**; `execFile` argv arrays; test case collisions on Windows.
6. **Concurrent Git / stale list** — short critical section; re-validate eligibility before each delete; partial batch → explicit summary.

## Implications for Roadmap

Suggested phase structure (dependencies: Git read → rules/baseline/merge → UI/delete → hardening):

### Phase 1: Extension scaffold & toolchain

**Rationale:** Nothing ships without a loadable extension and correct packaging constraints.  
**Delivers:** `package.json`, esbuild + `tsc --noEmit`, lazy activation, noop command, CI compile/test skeleton.  
**Addresses:** Palette discoverability foundation; practical VS Code + Cursor packaging.  
**Avoids:** Misaligned `@types/vscode` / `engines.vscode`; esbuild-as-only typecheck.

### Phase 2: Git port & adapter (read-only)

**Rationale:** All features depend on a stable Repository and metadata reads.  
**Delivers:** `GitRepositoryPort`, `VscodeGitRepositoryAdapter`, list locals + upstream + HEAD; handle Git extension missing/disabled and `getRepository` null.  
**Addresses:** Table stakes data for candidates and errors.  
**Avoids:** Heavy `activate()` work; duplicating Git via `simple-git` by default.

### Phase 3: Domain — candidates, baseline, merge

**Rationale:** FEATURES.md dependency chain: baseline before merge labels; same baseline for safety gate.  
**Delivers:** gitcleaner-style filters, exclude current, `origin/HEAD` + fallbacks, merged/unmerged via `getMergeBase` + tips (locked by unit tests + fixtures).  
**Addresses:** Candidate list, merge indicators, non-merged policy inputs.  
**Avoids:** Pitfalls 1–2, 4–6 (baseline, shallow policy, refnames, casing as far as domain layer allows).

### Phase 4: Cleanup UI & delete orchestration

**Rationale:** User-facing flow validates the whole stack; deletes last.  
**Delivers:** QuickPick multi-select, selection → service → `deleteBranch`, progress/cancel, error mapping (`BranchNotFullyMerged`, etc.), post-run summary.  
**Addresses:** Explicit selection, cancellation safety, local delete only.  
**Avoids:** UI-embedded rules; races (pre-delete re-check); silent partial deletes.

### Phase 5: Hardening & product polish

**Rationale:** Parallelizable once core path exists; closes real-world matrix.  
**Delivers:** Multi-root repo picker, settings (remote/baseline override), performance (batching, cache baseline per run), worktree/shallow/Windows fixtures, optional P2 UX (dry-run, richer QuickPick).  
**Addresses:** P2 features; edge cases from FEATURES/PITFALLS.  
**Avoids:** O(n) blocking UI; ignoring `git.path` if any CLI spawn remains.

### Phase Ordering Rationale

- **Read path before destructive path** — list/upstream/baseline/merge must be trustworthy before QuickPick + delete.  
- **Single application service** — keeps P1 non-merged gate aligned with UI labels (one codebase for “merged”).  
- **Pitfall-heavy work** (baseline, merge predicate, shallow, worktrees) clusters in Phases **3–5** with verification fixtures.

### Research Flags

Phases likely needing deeper research or fixture-heavy planning (`/gsd-research-phase` if planners hit unknowns):

- **Phase 3:** `origin/HEAD` edge cases, shallow policy, merge-base semantics vs product copy — **MEDIUM** doc coverage; **HIGH** validation need.
- **Phase 4:** Race conditions, partial delete UX, CancellationToken threading — behavior best proven with integration tests.
- **Phase 5:** Windows ref casing, large repos — environment matrix.

Phases with standard patterns (lighter research):

- **Phase 1:** Official bundling, manifest, vsce — well documented.
- **Phase 2:** `vscode.git` surface from `git.d.ts` — authoritative; watch known `getRepository` null caveat.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Official VS Code docs + `git.d.ts`; npm pins are “as of date” — re-verify before lockfile freeze. |
| Features | MEDIUM | Grounded in PROJECT.md + API reference; marketplace/competitor scan not exhaustive. |
| Architecture | HIGH | Matches extension-host + Git extension guidance; merge edge cases need implementation proofs. |
| Pitfalls | MEDIUM | Git semantics solid; some items need repo fixtures and CI matrix. |

**Overall confidence:** MEDIUM-HIGH for direction; **MEDIUM** for edge-case completeness until fixtures exist.

### Gaps to Address

- **Minimum `engines.vscode` / Cursor floor** — pick explicitly and test oldest supported.
- **Exact merge predicate vs squash-merge culture** — product copy + optional future policy toggle; not fully resolved by research alone.
- **Web extension path** — out of scope for v1; if later needed, separate bundle target (webpack/webworker) per official guidance.
- **Fixture repos** — shallow, missing `origin/HEAD`, worktree pair, ambiguous tag/branch — plan during Phase 3–5.

## Sources

### Aggregated from research artifacts

- **STACK.md / ARCHITECTURE.md / PITFALLS.md:** [VS Code — Bundling Extensions](https://code.visualstudio.com/api/working-with-extensions/bundling-extension), [Publishing Extensions](https://code.visualstudio.com/api/working-with-extensions/publishing-extension), [Testing Extensions](https://code.visualstudio.com/api/working-with-extensions/testing-extension), [Activation events](https://code.visualstudio.com/api/references/activation-events), [Quick Picks UX](https://code.visualstudio.com/api/ux-guidelines/quick-picks), [Webview guide](https://code.visualstudio.com/api/extension-guides/webview), [`extensions/git/src/api/git.d.ts`](https://github.com/microsoft/vscode/blob/main/extensions/git/src/api/git.d.ts), [vscode#111210](https://github.com/microsoft/vscode/issues/111210), [vsce#455](https://github.com/microsoft/vscode-vsce/issues/455).
- **FEATURES.md:** `.planning/PROJECT.md`, [gitcleaner](https://github.com/PavlikPolivka/gitcleaner), [VS Code API — window / QuickPick](https://code.visualstudio.com/api/references/vscode-api).
- **PITFALLS.md:** Git docs (`merge-base`, `worktree`, `branch`, `remote`), VS Code Git/`git.path` docs (confirm names per target version).

---
*Research completed: 2026-04-14*  
*Ready for roadmap: yes*
