# Phase 5 — Technical Research

**Phase:** Safety, local deletion, and outcomes  
**Researched:** 2026-04-14  
**Question:** What do we need to know to plan guarded local deletion and outcomes?

## Findings

### vscode.git `Repository.deleteBranch`

- Vendored API (`src/types/git.d.ts`): `deleteBranch(name: string, force?: boolean): Promise<void>`.
- **Non-force** delete fails when the branch is not fully merged (Git reports not merged). **Force `true`** performs local deletion anyway; it does **not** imply pushing or deleting `refs/remotes/*` — it is still a **local ref** operation (**SAFE-02**).
- Planning assumption: use **`force: false`** for rows classified **`merged`**; use **`force: true`** only after the user has passed the **strong confirmation** path for **`not_merged`** / **`unknown`** rows (**SAFE-01** alignment with labels).

### SAFE-01 — Single policy (recommended for planning)

- **Chosen policy:** **Strong confirmation** (not silent block-only): after QuickPick, if **any** selected branch has `merge === 'not_merged'` or `merge === 'unknown'`, show **one** blocking **`showWarningMessage`** with `{ modal: true }` that:
  - Names the **same baseline** as the run (`plan.baseline.displayLabel`).
  - Lists the **risky branches** (not_merged + unknown only) with wording consistent with QuickPick detail lines (`mergeDetailLine` semantics).
  - Offers **Cancel** (no deletes) vs **confirm** that proceeds to delete the **full** QuickPick selection (executor implements exact button labels per VS Code patterns).
- Selections that are **only** `merged` skip this extra gate (labels already state merged; policy does not contradict).
- **unknown** is treated like **not_merged** for gating (cannot claim merged; safer default).

### SAFE-03 — Modal summary (from `05-CONTEXT.md` D-01–D-04)

- Use **`MessageOptions.modal: true`** so the result is blocking and impossible to miss.
- **Per-branch lines** in the body: failures first (branch + reason), then successes.
- If **any** failure: `showWarningMessage` or `showErrorMessage` (error-level if product prefers; minimum **warning** per D-04).
- If **all** succeed: `showInformationMessage` with modal + short list (D-02, D-04).

### Integration point- `src/extension.ts` — after `showQuickPick` resolves, map `branchName` back to `CleanupCandidateRow` via a `Map` or filter on `plan.candidates` / `sorted`.

### Out of scope (v1)

- Remote branch deletion, `git push origin --delete`, or any `origin/*` mutation (**SAFE-02**).

## Validation Architecture

- **Automated:** Vitest for **pure** helpers (summary line ordering, optional message body formatting) without `vscode` or Git.
- **Grep gates:** Assert no `push(` / `deleteRemoteBranch` / obvious remote-delete patterns in `src/` if introduced; assert `deleteBranch` only in controlled module(s).
- **Manual / Extension Host:** Single-repo smoke: merged local branch deletes with summary; cancel on non-merged confirmation leaves branches intact.

## RESEARCH COMPLETE
