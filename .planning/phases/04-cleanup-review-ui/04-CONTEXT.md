# Phase 4: Cleanup review UI - Context

**Gathered:** 2026-04-14
**Status:** Ready for planning

<domain>
## Phase Boundary

The user reviews **cleanup candidates** in native VS Code selection UI (**multi-select QuickPick** or equivalent), sees **merge state** and **resolved baseline**, **explicitly selects** which branches may proceed toward deletion (no bulk-delete shortcut), and **cancel / dismiss** ends with **no branch mutations**. This phase does **not** implement deletion, safety policy for non-merged picks, or post-run summaries (**Phase 5**).

</domain>

<decisions>
## Implementation Decisions

### Row presentation (merge signal in the list)

- **D-01:** Use **`QuickPickItem.iconPath`** with **`vscode.ThemeIcon`** (Codicons) per row so merge state is visible at a glance, in the spirit of **gitcleaner / JetBrains-style** visual cues.
- **D-02:** Each row includes a **`detail`** line with **plain-language** merge state for the **same resolved baseline** as the run: e.g. merged into `{baseline label}`, not merged into `{baseline label}`, and **could not verify** (or equivalent) for **unknown** — so labels stay interpretable and accessible (not icon-only).
- **D-03:** The **`label`** is the **branch short name**; merge state is conveyed via **icon + detail**, not by hiding text behind icons only.

### List ordering

- **D-04:** Candidates are sorted **merged first**, then **not merged**, then **unknown**; within each group, **alphabetical by branch name**.

### Baseline visibility (UXP-03)

- **D-05:** Baseline placement was **not** discussed in this session. **Requirement remains:** the user must see the **resolved baseline** alongside merge indicators. **Default for planning:** surface `plan.baseline.displayLabel` in **QuickPick chrome** (e.g. **`title`** and/or **`placeholder`**) so it is visible for the whole review; avoid relying only on a one-shot notification before the picker opens.

### Claude's Discretion

- Exact **Codicon** ids per merge state and exact **detail** string wording (punctuation, baseline interpolation).
- Whether **`showQuickPick` (`canPickMany`)** or **`createQuickPick`** is used — choose the smallest API that satisfies **D-01–D-05** and **title/baseline** visibility.
- Exact **empty-candidate** copy and whether to use an **information message** vs an empty picker (must remain a **no-op** on cancel).

### Folded Todos

- None.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Product and requirements

- `.planning/ROADMAP.md` — Phase 4 goal, success criteria, **UXP-01–UXP-03**.
- `.planning/REQUIREMENTS.md` — **UXP-01**, **UXP-02**, **UXP-03** acceptance text; **UXP-10** (richer picker) is v2 only.
- `.planning/PROJECT.md` — Core value, WebStorm/gitcleaner reference, active QuickPick requirement.

### Prior phase context and data shapes

- `.planning/phases/03-domain-candidates-baseline-merge/03-CONTEXT.md` — **ResolvedBaseline**, merge semantics (**ancestor**), **unknown** handling; **D-07** squash/rebase stance (tooltip/detail may reference).
- `.planning/phases/02-git-repository-read-path/02-CONTEXT.md` — Repository resolution, **`LocalBranchSummary`** expectations.

### Research

- `.planning/research/PITFALLS.md` — Merge baseline and **unknown** merge classification pitfalls (inform detail copy and expectations).

### Implementation entrypoints

- `src/git/cleanupRun.ts` — **`buildCleanupRunPlan`**, **`CleanupCandidateRow`** (`merge`: `merged` | `not_merged` | `unknown`).
- `src/extension.ts` — **`branchCleaner.cleanupBranches`** command (compose plan → UI).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- **`buildCleanupRunPlan`** / **`CleanupCandidateRow`** — Per-run **baseline** + **candidates** with **merge** enum; primary input to QuickPick items.
- **`resolveRepositoryForWorkspace`**, **`getGitApi`** — Existing command wiring for repo resolution before building the plan.

### Established Patterns

- **vscode.git API** for all Git reads; **no raw Git CLI** in extension path for this flow.
- Command already surfaces **baseline** and counts via **`showInformationMessage`** (Phase 3); Phase 4 should move **review** to QuickPick and keep **baseline** visible per **UXP-03**.

### Integration Points

- Replace or augment the **information-only** path in **`extension.ts`** with **multi-select QuickPick** driven by **`buildCleanupRunPlan`** output; **Phase 5** will consume **explicit user selection** for delete policy.

</code_context>

<specifics>
## Specific Ideas

- User asked for **icons** comparable to the **original gitcleaner-style** experience; **ThemeIcon + detail text** locks that intent while keeping requirements interpretable.

</specifics>

<deferred>
## Deferred Ideas

- **Picker mechanism** ( **`showQuickPick`** vs **`createQuickPick`** ) — not discussed; planner picks per Claude's Discretion.
- **Zero candidates**, **Escape**, **OK with no selection** — not discussed; planner must satisfy **UXP-01** (cancel = no mutations) and clarify UX copy.
- **Remote/host deletion**, **non-merged safety policy**, **post-delete summary** — **Phase 5**.

### Reviewed Todos (not folded)

- None (`todo match-phase` returned no matches).

</deferred>

---

*Phase: 04-cleanup-review-ui*
*Context gathered: 2026-04-14*
