# Phase 2 — Research: vscode.git read path

**Date:** 2026-04-14  
**Sources:** [microsoft/vscode `extensions/git/src/api/git.d.ts` @ 1.96.4](https://raw.githubusercontent.com/microsoft/vscode/1.96.4/extensions/git/src/api/git.d.ts), project CONTEXT.md, REQUIREMENTS.md.

## API entry

- Extension loads built-in Git contribution: `vscode.extensions.getExtension('vscode.git')`.
- Cast `exports` to `GitExtension`; guard `enabled === false` → user-facing error (GIT-03).
- `gitExtension.getAPI(1)` returns `API` with `repositories: Repository[]` and `getRepository(uri: Uri): Repository | null`.

## Repository selection

- Each `Repository` exposes `rootUri: Uri` — compare `fsPath` (after normalization) to workspace folder `uri.fsPath` values.
- `API.getRepository(someUri)` can resolve a repo for a file URI; useful when the active editor is inside a nested folder.

## Branch metadata (GIT-02)

- `Repository.getBranches(query: BranchQuery, token?)` returns `Promise<Branch[]>`.
- `BranchQuery` extends `RefQuery` with `readonly remote?: boolean` — use **`{ remote: false }`** (or omit depending on default) to list **local** branches.
- `Branch` extends `Ref`: `type`, `name?`, `commit?`, `remote?`, plus **`upstream?: UpstreamRef`**, **`ahead?`**, **`behind?`**.
- `UpstreamRef`: `remote`, `name`, `commit?` — sufficient for tracking / “gone” style reasoning in Phase 3.

## Errors

- `getAPI` throws if Git is disabled — catch and `showErrorMessage`.
- `getBranches` failures — same; include hint to open Git Output if appropriate (optional discretion).

## Typings in repo

- Vendor `git.d.ts` from the same **1.96.x** line as `engines.vscode` (pin commit or tag in RESEARCH footer when file is added) under e.g. `src/types/git.d.ts`.
- Import types only; runtime `require`/`getExtension` stays untyped or minimal interface until vendored.

## Open questions (for planner / implementer)

- Exact default of `BranchQuery` when `remote` omitted — verify at implementation time against pinned `git.d.ts`.
- Whether `state.HEAD` should be read for “current branch” context in Phase 2 (read-only diagnostic) vs defer entirely to Phase 3.
