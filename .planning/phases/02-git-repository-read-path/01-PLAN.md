---
phase: 02-git-repository-read-path
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - src/extension.ts
  - src/git/api.ts
  - src/git/repositoryPicker.ts
  - src/types/git.d.ts
autonomous: true
requirements:
  - GIT-01
  - GIT-03
must_haves:
  truths:
    - "Extension obtains GitExtension + API v1 without throwing when Git is enabled; disabled Git yields showErrorMessage (not silent)."
    - "resolveRepositoryForWorkspace() returns a Repository whose rootUri matches a workspace folder per CONTEXT D-02/D-03, or null with documented reason."
    - "Multi-root disambiguation follows CONTEXT: active editor folder first, else first workspace folder with a match."
    - "Vendored src/types/git.d.ts exists and matches 1.96.x API surface used (Branch, BranchQuery, Repository, API, GitExtension)."
  artifacts:
    - path: src/types/git.d.ts
      provides: vscode.git API typings (vendored)
    - path: src/git/api.ts
      provides: getGitApi(), assertGitEnabled()
    - path: src/git/repositoryPicker.ts
      provides: resolveRepositoryForWorkspace()
    - path: src/extension.ts
      provides: command calls resolver; shows error on null
  key_links:
    - from: package.json extensionDependencies
      to: src/git/api.ts getExtension('vscode.git')
      via: extension id vscode.git
---

<objective>
Wire **vscode.git** API access: vendored **`git.d.ts`**, safe **`getAPI(1)`** acquisition with enablement checks, and **workspace → Repository** resolution matching **02-CONTEXT.md** D-01–D-04 and D-08–D-09. The Cleanup Branches command should resolve the repo or show a **clear error** (no silent failure).

Output: `src/types/git.d.ts`, `src/git/api.ts`, `src/git/repositoryPicker.ts`, updated `src/extension.ts`.
</objective>

<execution_context>
@$HOME/.cursor/get-shit-done/workflows/execute-plan.md
@$HOME/.cursor/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/REQUIREMENTS.md
@.planning/phases/02-git-repository-read-path/02-CONTEXT.md
@.planning/phases/02-git-repository-read-path/01-RESEARCH.md
@package.json
@src/extension.ts
</context>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Git extension host | Only talks to `vscode.git` in-process API; no subprocess Git in this plan. |
| Workspace paths | Compare filesystem paths carefully on Windows (case, separators). |

## Misuse / failure modes

- Git disabled → must not throw out of `activate`; command path handles.
- No matching repository → error message lists likely causes (not a git root, Git not initialized).

</threat_model>

<tasks>

## Task 1 — Vendor `git.d.ts`

1. Copy [vscode 1.96.4 `git.d.ts`](https://raw.githubusercontent.com/microsoft/vscode/1.96.4/extensions/git/src/api/git.d.ts) to `src/types/git.d.ts`.
2. Ensure `tsconfig.json` `include` covers `src/types` (adjust if needed).

## Task 2 — `src/git/api.ts`

1. Minimal runtime types: only what `getExtension` needs (`GitExtension` with `enabled`, `getAPI`).
2. `export async function getGitApi(): Promise<API>` — throws **translated** `Error` with code, or returns API; callers map to `showErrorMessage`.
3. Handle `!extension` (Git not installed — rare with `extensionDependencies` but possible) and `!gitExtension.enabled`.

## Task 3 — `src/git/repositoryPicker.ts`

1. `export function resolveRepositoryForWorkspace(api: API): Repository | undefined` implementing CONTEXT multi-root rules using `vscode.window.activeTextEditor?.document.uri` + `workspace.getWorkspaceFolder` + `api.repositories` / `api.getRepository` as appropriate.
2. Normalize paths with Node `path` for cross-platform compare.

## Task 4 — `extension.ts`

1. In `branchCleaner.cleanupBranches`, call `getGitApi()` then `resolveRepositoryForWorkspace`.
2. On failure: `vscode.window.showErrorMessage` with stable prefix **`Branch Cleaner:`** and actionable text (GIT-03).
3. On success (this plan): optional `showInformationMessage` with repo `rootUri.fsPath` for **smoke verification** is acceptable temporarily; **Plan 02** replaces with real branch read output or removes toast.

</tasks>

<verification>
- `npm run compile` exits 0.
- Manual: open this repo in VS Code/Cursor, run **Git: Cleanup Branches** — no crash; with Git enabled, resolves this repo’s `Repository`.
</verification>
