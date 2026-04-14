# Architecture Research

**Domain:** VS Code / Cursor extension — Git local branch cleanup (gitcleaner-style workflow)  
**Researched:** 2026-04-14  
**Confidence:** HIGH for extension shell, Git Extension API surface, and activation guidance (official docs + `git.d.ts`); MEDIUM for exact “merged into default branch” predicates in all edge cases (requires implementation validation against real repos).

## Standard Architecture

### System Overview

VS Code extensions are a **single Node process** per host: your code runs in the **Extension Host**, talks to the editor through `vscode`, and reaches Git through the **built-in Git extension’s programmatic API** (preferred) or, if needed, **`git` on `PATH`** invoked as a child process for commands not exposed on the API.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         VS Code Extension Host                               │
├─────────────────────────────────────────────────────────────────────────────┤
│  Contribution layer (declarative)                                            │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────────┐ │
│  │ package.json     │  │ Commands / menus │  │ (optional) Settings /    │ │
│  │ activationEvents │  │ contribution     │  │ keybindings              │ │
│  └────────┬─────────┘  └────────┬─────────┘  └────────────┬─────────────┘ │
├───────────┴─────────────────────┴─────────────────────────┴───────────────┤
│  Runtime wiring (thin)                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ extension.ts — activate()/deactivate(), register disposables        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────────────────┤
│  Presentation / UX                                                         │
│  ┌────────────────────┐  ┌────────────────────┐  ┌────────────────────┐   │
│  │ Command handlers   │  │ QuickPick / input  │  │ (defer) Webview    │   │
│  │ (orchestrate only) │  │ (multi-select UI)  │  │                    │   │
│  └─────────┬──────────┘  └─────────┬──────────┘  └─────────┬──────────┘   │
├────────────┴──────────────────────┴───────────────────────┴───────────────┤
│  Application / domain                                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ BranchCleanupApplicationService                                       │   │
│  │ — candidate rules, merge gating, default-branch policy, delete plan   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────────────────┤
│  Infrastructure ports                                                     │
│  ┌──────────────────────────────┐  ┌────────────────────────────────────┐   │
│  │ GitRepositoryPort (interface)│  │ VscodeGitRepositoryAdapter        │   │
│  │ — branches, upstream, merge   │  │ — vscode.git API + typed errors   │   │
│  │   baseline, delete            │  │ — optional raw git exec fallback  │   │
│  └──────────────────────────────┘  └────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
         │                                    │
         ▼                                    ▼
┌─────────────────────┐            ┌──────────────────────────────┐
│ vscode.* UI APIs    │            │ Built-in `vscode.git`       │
│ window, commands, …  │            │ extension (`getAPI(1)`)     │
└─────────────────────┘            └──────────────┬──────────────┘
                                                  │
                                                  ▼
                                       ┌──────────────────────┐
                                       │ libgit2 / git binary │
                                       │ (implementation      │
                                       │  detail of built-in) │
                                       └──────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical implementation |
|-----------|------------------|-------------------------|
| **Manifest (`package.json`)** | Declares engines, activation, commands, categories | `contributes.commands`, `activationEvents` (see below) |
| **`extension.ts`** | One-time setup: obtain Git API when needed, register commands, bind services | `activate(context)` returns disposables; avoid heavy work |
| **Command layer** | Map user invocation → application call; no Git rules | `registerCommand('…cleanupBranches', () => service.run())` |
| **Application service** | **Owns product rules:** candidate set (no/missing upstream), exclude current branch, default branch resolution (`origin/HEAD` + fallbacks), merged/unmerged classification, delete safety policy | Pure TS module(s), unit-testable with fake `GitRepositoryPort` |
| **`GitRepositoryPort`** | Stable boundary for “what the app needs from Git” | Interface in `ports/` or `git/` |
| **`VscodeGitRepositoryAdapter`** | Implements port using `Repository` from built-in Git API | `extensions.getExtension<vscode.git>('vscode.git')?.exports.getAPI(1)` |
| **UI module** | Build QuickPick items, titles, multi-select; no business rules beyond display | `window.createQuickPick` or `showQuickPick` with `canPickMany` |
| **Error mapping** | Turn Git failures into user-visible, safe outcomes | Map `GitErrorCodes` (e.g. `BranchNotFullyMerged`) to messages / guards |

## Extension entrypoints and activation events

**Runtime entrypoint:** `package.json` → `"main": "./out/extension.js"` (or bundled output) exporting `activate` and optionally `deactivate`.

**Recommended activation strategy (lazy, Git-aware):**

| Activation | Rationale |
|------------|-----------|
| `onCommand:<your.cleanupBranches>` | User-driven; aligns with “activate only when needed” ([activation events](https://code.visualstudio.com/api/references/activation-events)). |
| `workspaceContains:**/.git` | Opens the extension when a Git worktree is present so commands can appear in sensible contexts without `*`. |

**Notes from official docs:**

- Since **VS Code 1.74+**, `onCommand:` is **not strictly required** for commands your extension contributes — VS Code can activate the extension when those commands run. Declaring `onCommand` remains valid and documents intent.
- Avoid `"*"` unless unavoidable; it competes with startup performance ([same reference](https://code.visualstudio.com/api/references/activation-events)).

**`onWebviewPanel`:** Only if you later add a webview; you still need a primary activation path (e.g. command) to create the panel first ([activation events — onWebviewPanel](https://code.visualstudio.com/api/references/activation-events)).

## Layering: commands → application service → Git access

**Rule:** Commands and UI **do not** call `getAPI(1)` or parse `git` output directly. They call **one application service** (or a small façade) that depends on **`GitRepositoryPort`**.

```
User: "Cleanup Branches"
        ↓
registerCommand handler (parse workspace folder / active repo URI if needed)
        ↓
BranchCleanupApplicationService.run(repoRoot)
        ↓
GitRepositoryPort — list locals, read upstream, resolve baseline ref, merge check, deleteBranch
        ↓
VscodeGitRepositoryAdapter — vscode.git `Repository` methods
```

**Why:** Keeps gitcleaner-style rules and safety policy testable; swaps Git backend (API vs raw CLI) without rewriting UX.

## Obtaining branch lists, upstream metadata, and merge baseline

### Preferred: Built-in Git Extension API (`vscode.git`)

Official type surface is published in the VS Code repo as [`extensions/git/src/api/git.d.ts`](https://github.com/microsoft/vscode/blob/main/extensions/git/src/api/git.d.ts) (HIGH confidence for **what exists**).

**Acquire API:**

1. `const ext = vscode.extensions.getExtension('vscode.git');`
2. Ensure enabled; await `ext?.activate()` if needed.
3. `const gitApi = ext.exports.getAPI(1);` — `getAPI` throws if Git is disabled (`GitExtension` docs in same file).
4. Resolve `Repository`: `gitApi.getRepository(uri)` or `gitApi.openRepository(rootUri)` when the repo is not yet in the SCM cache (known limitation: `getRepository` can return `null` for URIs the Git extension has not opened — see [vscode#111210](https://github.com/microsoft/vscode/issues/111210)).

**Branch list and upstream:**

- `repository.getBranches(query, token)` with `BranchQuery` — e.g. locals vs remotes via `remote?: boolean` ([`BranchQuery`](https://github.com/microsoft/vscode/blob/main/extensions/git/src/api/git.d.ts)).
- Each `Branch` includes optional `upstream?: UpstreamRef` (`remote`, `name`, `commit`) — use this for **“has usable upstream”** instead of shell-parsing `git branch -vv` when possible.
- Current branch: `repository.state.HEAD` (also a `Branch`).

**Default integration branch (`origin/HEAD`):**

- Prefer resolving via **refs** APIs: `repository.getRefs({ pattern: … }, token)` ([`RefQuery`](https://github.com/microsoft/vscode/blob/main/extensions/git/src/api/git.d.ts)) to find `refs/remotes/origin/HEAD` or symbolic target, **or** `getConfig` / remote metadata as fallback.
- **MEDIUM confidence:** exact ref names and edge cases (detached `HEAD`, multiple remotes, renamed `origin`) should be validated in phase implementation; document fallbacks in the application layer (e.g. `init.defaultBranch`, `main`/`master` heuristic last).

**“Merged into baseline” check:**

- API includes `repository.getMergeBase(ref1, ref2)` ([`Repository`](https://github.com/microsoft/vscode/blob/main/extensions/git/src/api/git.d.ts)) — sufficient to implement **fully merged** logic in combination with commit hashes from `getBranch` / `getCommit` (implementation detail: compare merge-base to branch tip; unit tests should lock semantics).
- **Deletes:** `repository.deleteBranch(name, force?)` — built-in Git already surfaces `GitErrorCodes.BranchNotFullyMerged` when non-force delete is unsafe ([`GitErrorCodes`](https://github.com/microsoft/vscode/blob/main/extensions/git/src/api/git.d.ts)).

### Fallback: invoke `git` CLI

Use **only** when the Git API cannot express an operation (rare for this project) or for diagnostics.

- **Pros:** Full Git CLI surface (`symbolic-ref`, porcelain, etc.).
- **Cons:** Path/spacing issues on Windows, version differences, duplicate logic with built-in SCM, harder to keep Cursor/VS Code behavior aligned.

**Recommendation:** Implement **95%+ against `vscode.git` `Repository`**; add a **narrow** CLI helper only if a specific ref resolution fails across versions.

## UI flow: QuickPick vs custom webview

| Criterion | QuickPick (native) | Webview |
|-----------|-------------------|---------|
| Fit for “pick branches + merged badges + confirm” | **Strong fit** — multi-select, title, description, detail, separators ([Quick Picks UX](https://code.visualstudio.com/api/ux-guidelines/quick-picks)) | Overkill for v1 |
| Cost / complexity | Low | High ([Webview guide](https://code.visualstudio.com/api/extension-guides/webview): resource-heavy, separate context, message passing) |
| Parity with JetBrains dialog | Acceptable with careful labels + `detail` / `description` | Easiest for pixel-perfect parity, **not** justified until native UX is proven insufficient |

**Official webview guidance:** use webviews **sparingly**, only when native APIs are inadequate ([“Should I use a webview?”](https://code.visualstudio.com/api/extension-guides/webview)).

**Recommendation for this product:** **Multi-step or single QuickPick with `canPickMany: true`**, titled flow, optional “refresh candidates” button, clear grouping (e.g. merged vs not merged via separators). Defer webview unless you need custom tables, sorting UX, or dense metadata beyond QuickPick ergonomics.

## Error handling boundaries

| Boundary | Responsibility | Pattern |
|----------|----------------|---------|
| **Git adapter** | Translate `vscode.git` rejections into **typed** errors (subset of `GitErrorCodes` + generic `Error`). No `window.showErrorMessage` here. | Throw domain errors: `NotAGitRepo`, `GitDisabled`, `BranchNotFullyMerged`, `NetworkOrRemote` |
| **Application service** | **Policy:** which errors block the whole flow vs. single branch; never swallow merge-safety failures. | Return `Result` or throw only for truly fatal setup (no repo, no git extension) |
| **Command / UI layer** | User-visible messaging, progress (`withProgress`), cancellation (`CancellationToken`). | `try/catch` at command top-level → `showErrorMessage`; per-branch delete failures → aggregate report |
| **Pre-delete guard** | Even if UI allows selection, re-check **merged** / **force** policy before calling `deleteBranch`. | Defense in depth with non-force delete first |

**Cancellation:** Thread `CancellationToken` from `withProgress` or QuickPick into `getBranches` / long loops so ESC aborts cleanly.

## Data flow

### Primary flow: cleanup command

```
Command "Cleanup Branches"
  → pick workspace folder / resolve Repository rootUri
  → ApplicationService.loadContext()
        → GitPort.getDefaultBaseline()  // origin/HEAD + fallbacks
        → GitPort.listLocalBranches()
        → filter: gitcleaner-style candidates (upstream rules)
        → filter: exclude current HEAD.name
        → for each candidate: GitPort.isMergedInto(candidateTip, baseline)
  → UI.presentCandidates(enriched rows)
  → User confirms selection to delete
  → ApplicationService.deleteSelected()
        → for each: GitPort.deleteBranch(name, force per policy)
  → UI.summary (deleted / skipped / errors)
```

### Repository change flow

Subscribe to `repository.state.onDidChange` (from [`RepositoryState`](https://github.com/microsoft/vscode/blob/main/extensions/git/src/api/git.d.ts)) if you add **refresh** behavior so branch list stays coherent after checkout or fetch.

## Recommended project structure

```
src/
├── extension.ts                 # activate/deactivate; register commands
├── commands/
│   └── cleanupBranches.ts       # thin: resolve repo, call service, show errors
├── application/
│   └── branchCleanupService.ts  # gitcleaner rules, merge gating, orchestration
├── git/
│   ├── gitRepositoryPort.ts     # interface consumed by application
│   └── vscodeGitAdapter.ts      # vscode.git implementation (+ optional cli fallback)
├── model/
│   └── types.ts                 # BranchCandidate, MergeState, BaselineRef
├── ui/
│   └── cleanupQuickPick.ts      # QuickPick construction only
└── test/                        # unit tests with fake GitPort
```

### Structure rationale

- **`application/`** isolates rules mandated by `PROJECT.md` from VS Code types — stable for testing and roadmap phases.
- **`git/`** isolates **how** metadata is obtained; swap or extend without touching UI.
- **`ui/`** keeps presentation disposable if you later add a webview.

## Architectural patterns

### Pattern 1: Port–adapter for Git

**What:** Application depends on `GitRepositoryPort`; production uses `VscodeGitRepositoryAdapter`.  
**When:** Always for extensions that wrap external tools.  
**Trade-offs:** Slightly more files; big win for tests and future CLI fallback.

### Pattern 2: Single command façade + progressive enhancement

**What:** Ship one user-facing command; internal phases add settings (e.g. force policy) without new commands.  
**When:** MVP aligned with JetBrains “one cleanup action”.  
**Trade-offs:** Fewer discoverable entry points; mitigate with clear title and docs.

### Pattern 3: Non-destructive default + explicit force path

**What:** Default delete path uses `deleteBranch(name, false)`; only allow “force” when user explicitly confirms a **dangerous** action and `PROJECT.md` safety rules permit.  
**When:** Any destructive Git operation.  
**Trade-offs:** Extra confirmation step; matches product constraint (“clear errors and non-destructive defaults”).

## Scaling considerations (extension / large repos)

| Scale | What breaks first | Mitigation |
|-------|-------------------|------------|
| Hundreds of local branches | `getBranches` / merge checks latency | Batch with `withProgress`, cap UI batch, lazy-load merge status for visible slice only if needed |
| Huge history | `getMergeBase` / ref walks slower | Cache per session; invalidate on `onDidChange` |
| Multi-root workspace | Wrong repo selected | Disambiguation QuickPick early in command |

### Scaling priorities

1. **First bottleneck:** enumerating + classifying every branch — address with progress UI and cancellation.
2. **Second bottleneck:** repeated Git calls — memoize baseline ref and branch tips per run.

## Anti-patterns

### Anti-pattern 1: Heavy work in `activate()`

**What people do:** Resolve all repositories and scan branches at activation.  
**Why it's wrong:** Slows activation; violates lazy-load best practice.  
**Do this instead:** Resolve Git context **inside** the cleanup command (or on first command use).

### Anti-pattern 2: UI embedded business rules

**What people do:** QuickPick callbacks that call `deleteBranch` and apply merge rules inline.  
**Why it's wrong:** Untestable, duplicates logic, unsafe refactors.  
**Do this instead:** UI emits **intent** (selected names); application service validates and executes.

### Anti-pattern 3: Webview-first for a list+checkbox flow

**What people do:** React app in a panel for simple selection.  
**Why it's wrong:** High cost, native UX guidelines already cover this ([webview guidance](https://code.visualstudio.com/api/extension-guides/webview)).  
**Do this instead:** QuickPick multi-select; revisit webview only with concrete UX gaps.

## Integration points

### External services

| Service | Integration pattern | Notes |
|---------|---------------------|-------|
| **Built-in Git (`vscode.git`)** | `getExtension` + `getAPI(1)` + `Repository` | Handle `enabled === false`; handle `getRepository` null → `openRepository` |
| **User’s `git` binary** | Optional `child_process.spawn` via adapter | Only if API gap; respect `git.path` settings used by VS Code when possible |

### Internal boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Commands ↔ Application | Direct method calls | Keep the command file small (on the order of tens of lines) |
| Application ↔ Git port | Interface + DTOs | Optional: keep `vscode.Uri` out of domain types; string refs often suffice |
| Application ↔ UI | DTO in / selection out | UI returns picked branch names + labels optional |

## Suggested build order for phases (roadmap-oriented)

Order respects **dependencies** and keeps each phase shippable or demoable.

1. **Scaffold + activation** — `package.json`, `activate`, noop command, CI compile. *Validates:* extension loads in VS Code and Cursor.
2. **Git port + adapter (read-only)** — resolve `Repository`, `getBranches`, read `HEAD`, expose `upstream`. *Validates:* can list locals with upstream metadata.
3. **Domain: candidate selection** — gitcleaner-style filters + exclude current branch. *Validates:* candidate list matches `PROJECT.md` without delete.
4. **Baseline resolution** — `origin/HEAD` + documented fallbacks. *Flags for later research:* ambiguous remotes, shallow clones, empty repos ([`BranchNotYetBorn`](https://github.com/microsoft/vscode/blob/main/extensions/git/src/api/git.d.ts) class errors).
5. **Merge classification** — use `getMergeBase` + tip commits; encode “merged into baseline” in tests. *Validates:* merged/unmerged matches expectations on fixture repos.
6. **QuickPick UX** — multi-select, grouping, refresh. *Validates:* user can understand risk before delete.
7. **Delete path + error mapping** — `deleteBranch`, handle `BranchNotFullyMerged`, progress + summary. *Validates:* safe behavior under refusal cases.
8. **Hardening** — multi-root picker, cancellation, settings (e.g. allow force), telemetry optional.

**Implications:** Phases **2–3** unlock an internal preview; **5–7** unlock production safety; **8** is parallelizable once core flows exist.

## Sources

- [Activation Events](https://code.visualstudio.com/api/references/activation-events) — VS Code Extension API (retrieved 2026-04-08 per page footer).
- [Extension Guides overview](https://code.visualstudio.com/api/extension-guides/overview) — VS Code Extension API.
- [Quick Picks UX guidelines](https://code.visualstudio.com/api/ux-guidelines/quick-picks) — VS Code Extension API.
- [Webview API / when to use webviews](https://code.visualstudio.com/api/extension-guides/webview) — VS Code Extension API.
- [Git Extension API types (`git.d.ts`)](https://github.com/microsoft/vscode/blob/main/extensions/git/src/api/git.d.ts) — Microsoft `vscode` repository (authoritative interface).
- [vscode#111210 — `getRepository` null for unknown URIs](https://github.com/microsoft/vscode/issues/111210) — GitHub issue (integration caveat).

---
*Architecture research for: VS Code Branch Cleaner (Git local branch cleanup extension)*  
*Researched: 2026-04-14*
