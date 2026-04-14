---
phase: 02-git-repository-read-path
plan: 2
type: execute
wave: 1
depends_on:
  - 01-PLAN.md
files_modified:
  - src/git/branches.ts
  - src/extension.ts
autonomous: true
requirements:
  - GIT-02
  - GIT-03
must_haves:
  truths:
    - "listLocalBranches(repository) calls repository.getBranches with BranchQuery appropriate for local heads and returns stable serializable DTOs (name, commit, upstream remote/name, ahead/behind if present)."
    - "On getBranches rejection, user sees showErrorMessage with Branch Cleaner prefix (GIT-03)."
    - "No merge baseline, origin/HEAD, or candidate filtering in this plan (Phase 3 only)."
  artifacts:
    - path: src/git/branches.ts
      provides: listLocalBranches + DTO type(s)
    - path: src/extension.ts
      provides: command invokes list after resolve; surfaces count or debug summary
  key_links:
    - from: src/git/repositoryPicker.ts resolveRepositoryForWorkspace
      to: src/git/branches.ts listLocalBranches
      via: Repository instance
---

<objective>
Read **local branches** and **upstream / tracking metadata** via **`Repository.getBranches`** into a small **DTO** suitable for Phase 3 domain logic. Harden **error** reporting for read failures.

Output: `src/git/branches.ts`; `src/extension.ts` shows a **non-placeholder** result (e.g. informational message listing branch count and one sample upstream label, or `OutputChannel` line — pick one minimal approach in implementation).
</objective>

<execution_context>
@$HOME/.cursor/get-shit-done/workflows/execute-plan.md
@$HOME/.cursor/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/02-git-repository-read-path/02-CONTEXT.md
@.planning/phases/02-git-repository-read-path/01-RESEARCH.md
@src/git/api.ts
@src/git/repositoryPicker.ts
</context>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Read-only | No `deleteBranch`, `checkout`, or mutating Git calls in this plan. |

## Misuse / failure modes

- Large repos — `getBranches` may be slow; acceptable for v1 if uncancelled; optional `CancellationToken` from `vscode.CancellationTokenSource` if trivial to thread (Claude's discretion).

</threat_model>

<tasks>

## Task 1 — DTO + `listLocalBranches`

1. Define `export interface LocalBranchSummary { readonly name: string; readonly commit?: string; readonly upstream?: { readonly remote: string; readonly name: string; readonly commit?: string }; readonly ahead?: number; readonly behind?: number }`.
2. Implement `export async function listLocalBranches(repository: Repository, token?: vscode.CancellationToken): Promise<LocalBranchSummary[]>` using `getBranches({ remote: false }, token)` — confirm query against vendored `git.d.ts`; adjust if API expects explicit fields.

## Task 2 — Command integration

1. After successful `resolveRepositoryForWorkspace`, call `listLocalBranches`.
2. Replace scaffold-only toast with a **short** `showInformationMessage` reporting **count** and **current HEAD name** if available via `repository.state.HEAD?.name` (read-only context), or use `OutputChannel` named **Branch Cleaner** for multi-line listing — **one** mechanism only to avoid noisy UX.

## Task 3 — Errors

1. Wrap `getBranches` in try/catch → `showErrorMessage` with failure reason.

</tasks>

<verification>
- `npm run compile` exits 0.
- Manual: command shows branch count > 0 for this repo on main/develop-style setups.
</verification>
