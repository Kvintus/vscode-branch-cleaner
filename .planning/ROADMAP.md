# Roadmap: VS Code Branch Cleaner

## Overview

Ship a VS Code/Cursor extension that lists gitcleaner-style local branch candidates, labels merge state against a resolved default baseline (`origin/HEAD` with fallbacks), and deletes only what the user explicitly selects—safely, with clear errors and a post-run summary. Phases follow the dependency chain: **manifest and toolchain → Git read path → domain rules and tests → review UI → guarded local deletion**.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Extension scaffold, activation, and packaging** — Loadable extension with Cleanup Branches command, lazy activation, `vscode.git` dependency, typecheck/bundle/package flow, and README expectations for editors.
- [ ] **Phase 2: Git repository read path** — Repository handle, branch and upstream metadata for classification, user-visible errors on Git failures.
- [ ] **Phase 3: Domain — candidates, baseline, merge** — gitcleaner-style candidate set (excluding current branch), `origin/HEAD` baseline with documented fallbacks, consistent merged labels; automated tests for pure domain logic.
- [ ] **Phase 4: Cleanup review UI** — Multi-select QuickPick (or equivalent), explicit per-branch delete selection only, baseline visible in UI, dismiss leaves branches unchanged.
- [ ] **Phase 5: Safety, local deletion, and outcomes** — Non-merged handling consistent with labels, local-only deletes, aggregated success/failure summary after attempts.

## Phase Details

### Phase 1: Extension scaffold, activation, and packaging

**Goal**: The extension installs and activates predictably in VS Code/Cursor, exposes a discoverable **Cleanup Branches** command, declares the Git extension dependency, and documents supported hosts and build expectations.

**Depends on**: Nothing (first phase)

**Requirements**: EXT-01, EXT-02, EXT-03, EXT-04, QUAL-02

**Success Criteria** (what must be TRUE):

1. User can open the Command Palette and find **Cleanup Branches** under a clear Git-oriented title/category.
2. The extension does not activate on every workspace load when unused; activation matches a Git-aware, command-driven pattern (not universal `*` activation).
3. With the built-in Git extension available per manifest, activation does not fail solely due to missing `extensionDependencies` wiring for `vscode.git`.
4. Maintainer can run documented scripts to typecheck, bundle, and produce a VSIX (or equivalent package) with `engines.vscode` aligned to the pinned API types.
5. A new reader of the repository README understands that the target products are VS Code and Cursor and what minimum editor expectations mean at a high level.

**Plans**: TBD

### Phase 2: Git repository read path

**Goal**: For a folder that contains a Git repository, the extension obtains a reliable **Repository** view and reads local branches plus upstream/tracking metadata, surfacing clear errors when Git is unavailable or operations fail.

**Depends on**: Phase 1

**Requirements**: GIT-01, GIT-02, GIT-03

**Success Criteria** (what must be TRUE):

1. In a workspace with a Git repo, the extension can resolve an API-backed **Repository** for that folder when the Git extension is enabled.
2. The extension can enumerate local branches together with enough upstream/tracking metadata to support gitcleaner-style candidate classification in a later phase.
3. When there is no repo, Git is disabled, or an unexpected read error occurs, the user sees an explicit error message or notification instead of a silent no-op.

**Plans**: TBD

### Phase 3: Domain — candidates, baseline, merge

**Goal**: Candidate branches match gitcleaner-style intent (not all locals), never include the current branch, share one resolved merge baseline (preferring `origin/HEAD` with documented fallbacks), and show merged vs not merged consistently for that baseline; pure domain behavior is covered by automated tests.

**Depends on**: Phase 2

**Requirements**: DOM-01, DOM-02, DOM-03, DOM-04, QUAL-01

**Success Criteria** (what must be TRUE):

1. For representative fixture inputs, the classified **candidate** set matches the gitcleaner-style rules from `PROJECT.md` (abandoned / missing-remote-tracking style), not arbitrary “all local branches”.
2. The checked-out branch never appears in the candidate list produced by domain logic.
3. Merge comparison uses **`origin/HEAD`** when usable, and when it is missing or unusable the system follows a **single documented fallback order** and still resolves one baseline ref for the run.
4. Every candidate row’s merged/not-merged signal is computed against the **same resolved baseline** that downstream eligibility will use.
5. Automated tests exercise pure domain logic (candidate selection and merge/baseline classification) using fixtures where practical.

**Plans**: TBD

### Phase 4: Cleanup review UI

**Goal**: The user reviews candidates in native selection UI, sees which baseline merge labels refer to, explicitly chooses branches to delete (no bulk shortcut), and can cancel without any branch mutations.

**Depends on**: Phase 3

**Requirements**: UXP-01, UXP-02, UXP-03

**Success Criteria** (what must be TRUE):

1. User can open the cleanup flow and review candidates in a **multi-select QuickPick** (or equivalent native multi-select UX) and dismiss it to end with **no** branch deletions or state changes.
2. Only branches the user **explicitly selects** can proceed toward deletion; there is no v1 action that deletes all candidates without per-item selection.
3. The UI shows the **resolved baseline** (ref or explicit fallback label) alongside merge indicators so merged vs not merged is interpretable.

**Plans**: TBD

**UI hint**: yes

### Phase 5: Safety, local deletion, and outcomes

**Goal**: Deletion honors a single safety policy aligned with merge labels, never removes remote branches on the host, and always reports what succeeded and what failed.

**Depends on**: Phase 4

**Requirements**: SAFE-01, SAFE-02, SAFE-03

**Success Criteria** (what must be TRUE):

1. If the user selects branches that are **not fully merged** into the comparison baseline, behavior follows one **consistent safety policy** (block or strong confirmation) that **never contradicts** the merged/not-merged labels shown earlier in the flow.
2. Successful operations perform **local branch deletion only**; no v1 path deletes `origin/*` or otherwise mutates the remote host branch namespace.
3. After deletion attempts finish, the user sees a **summary** listing successes and failures (including partial batch outcomes), with no silent partial success.

**Plans**: TBD

**UI hint**: yes

## Progress

**Execution Order:**

Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Extension scaffold, activation, and packaging | 0/TBD | Not started | - |
| 2. Git repository read path | 0/TBD | Not started | - |
| 3. Domain — candidates, baseline, merge | 0/TBD | Not started | - |
| 4. Cleanup review UI | 0/TBD | Not started | - |
| 5. Safety, local deletion, and outcomes | 0/TBD | Not started | - |
