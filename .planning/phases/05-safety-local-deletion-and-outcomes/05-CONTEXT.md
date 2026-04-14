# Phase 5: Safety, local deletion, and outcomes - Context

**Gathered:** 2026-04-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 5 delivers **guarded local branch deletion** after Phase 4 review: behavior must align with **merge labels** and baseline for **non-merged** (and related) selections (**SAFE-01**), **local-only** deletes via the Git extension API—**no remote/host branch namespace mutations** (**SAFE-02**)—and a **post-run summary** of per-branch outcomes with **no silent partial success** (**SAFE-03**).

This discuss session **only locked decisions for the post-delete summary (SAFE-03)**. **SAFE-01** and **SAFE-02** implementation choices remain for planning/research from `.planning/REQUIREMENTS.md` and prior phase context unless supplemented later.

</domain>

<decisions>
## Implementation Decisions

### Post-delete summary (SAFE-03)

- **D-01:** Use a **modal / blocking** user-visible result that includes **enough content to list each branch outcome** (success vs failure with reason), not merely aggregate counts—so partial batches are never ambiguous.
- **D-02:** Use the **same modal pattern for every run**, including when **all selected branches delete successfully** (consistent “run finished” moment; list may be short or a single success summary line).
- **D-03:** Inside the summary text, order lines **failures first, then successes** so problems appear immediately in partial batches.
- **D-04:** **Escalate severity** when **any** deletion fails: use **warning- or error-appropriate** modal styling; use **neutral / information-style** modal only when **all** attempted deletes **succeeded**.

### Claude's Discretion

- Exact VS Code API calls (`showInformationMessage` / `showWarningMessage` / `showErrorMessage` and `MessageOptions.modal`), button labels, and string templates (including wrapping/truncation guards).
- **SAFE-01** (non-merged policy: block vs strong confirmation—single consistent policy aligned with QuickPick labels).
- **SAFE-02** execution details: `withProgress`, cancellation, **`Repository.deleteBranch`** options (e.g. force vs non-force), batch ordering—**local-only** invariant.
- Handling **merge state `unknown`** relative to labels and delete eligibility.
- Whether to add secondary affordances (e.g. **Copy** action, Output channel mirror) on top of the mandated modal summary.

### Folded Todos

- None.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Product and requirements

- `.planning/ROADMAP.md` — Phase 5 goal, success criteria, **SAFE-01–SAFE-03**.
- `.planning/REQUIREMENTS.md` — **SAFE-01**, **SAFE-02**, **SAFE-03** acceptance text.
- `.planning/PROJECT.md` — Core value, local-only v1, safety-over-aggression constraint.

### Prior phase context

- `.planning/phases/04-cleanup-review-ui/04-CONTEXT.md` — QuickPick merge presentation (**icon + detail**), baseline visibility, **merged-first** sort; explicit selection feeds Phase 5.
- `.planning/phases/03-domain-candidates-baseline-merge/03-CONTEXT.md` — **merge** semantics (`merged` | `not_merged` | `unknown`), baseline resolution.
- `.planning/phases/02-git-repository-read-path/02-CONTEXT.md` — Repository resolution patterns.

### Architecture and pitfalls

- `.planning/research/ARCHITECTURE.md` — Error boundaries, pre-delete guard, aggregate reporting at command/UI layer.

### Implementation entrypoints

- `src/extension.ts` — **`branchCleaner.cleanupBranches`** (compose plan → review → Phase 5 delete + summary).
- `src/git/cleanupRun.ts` — **`buildCleanupRunPlan`**, **`CleanupCandidateRow`**.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- **`buildCleanupRunPlan`** / **`CleanupCandidateRow`** — Per-row **`merge`** and baseline label; summary copy should stay consistent with the same semantics shown in QuickPick.
- **`resolveRepositoryForWorkspace`**, **`getGitApi`** — Existing command wiring; deletion should stay on the same **`Repository`** instance.

### Established Patterns

- **vscode.git** `Repository` for Git operations; Phase 4 established **no deletion** in the review step—Phase 5 adds delete + summary after explicit selection.

### Integration Points

- Extend **`extension.ts`** command handler after **`showQuickPick`** resolution: apply safety policy, call **`deleteBranch`** (or equivalent API) per selected branch, then present **modal summary** per **D-01–D-04**.

</code_context>

<specifics>
## Specific Ideas

- User prefers **modal** summary with **per-branch lines**, **always** shown (including full success), **failures listed first**, and **stronger modal styling when anything failed**.

</specifics>

<deferred>
## Deferred Ideas

- **Remote/host branch deletion** — v1 out of scope per **PROJECT.md**.
- **Non-merged / unknown-merge safety policy** and **delete execution** specifics were **not** discussed in this session; **REQUIREMENTS.md** and prior context still govern—re-run discuss if product owner wants these locked before planning.

### Reviewed Todos (not folded)

- None (`todo match-phase` returned no matches).

</deferred>

---

*Phase: 05-safety-local-deletion-and-outcomes*
*Context gathered: 2026-04-14*
