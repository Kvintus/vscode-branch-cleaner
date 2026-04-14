---
phase: 4
slug: cleanup-review-ui
status: draft
platform: vscode-native
created: 2026-04-14
---

# Phase 4 — UI Design Contract (VS Code native)

> Interaction and presentation contract for the **Cleanup Branches** review step. Uses **`vscode.window` QuickPick** APIs only (no webview). Aligned with `04-CONTEXT.md` decisions **D-01–D-05** and requirements **UXP-01–UXP-03**.

---

## Surface

| Property | Value |
|----------|-------|
| API | `vscode.window.showQuickPick` with `canPickMany: true`, or `vscode.window.createQuickPick` with `canSelectMany: true` |
| Entry | Command **`branchCleaner.cleanupBranches`** after `buildCleanupRunPlan` succeeds |
| Theme | Editor **workbench** colors and **Codicons** via `ThemeIcon` |

---

## Information architecture

1. **Chrome (title / placeholder):** Must show **`plan.baseline.displayLabel`** (resolved baseline or explicit fallback label) so **UXP-03** is satisfied without relying on a one-shot pre-notification only.
2. **Rows:** One QuickPick item per **`CleanupCandidateRow`** from `buildCleanupRunPlan`.
3. **Ordering:** Merged first → not merged → unknown; within each group, **alphabetical** by branch short name (**D-04**).

---

## Row presentation

| Field | Rule |
|-------|------|
| `label` | Branch **short name** only (**D-03**) |
| `description` / `detail` | Plain-language merge state for **the same baseline** as the run: merged / not merged / could not verify (**D-02**) |
| `iconPath` | `vscode.ThemeIcon` (Codicon) per merge state for at-a-glance scan (**D-01**); exact icon ids are implementation discretion |

**Accessibility:** Merge meaning must remain clear from **text** (`detail`), not icon-only (**D-02**).

---

## Selection & safety (Phase 4 scope)

- **Multi-select** enabled (**UXP-01**).
- **Cancel / dismiss** (Escape, blur): **no** branch mutations; same as today for informational path — end command (**UXP-01**).
- **No** control labeled or implied as “delete all candidates” without per-item selection (**UXP-02**). Primary confirmation action copy must not bypass explicit multi-select (e.g. no default “Delete all” button).
- **Phase 5** owns deletion, non-merged policy, and summaries; Phase 4 may use a **Continue** / **Next** style acceptance that only returns **explicitly selected** branch names (or empty selection) to the caller.

---

## Empty state

- **Zero candidates:** User-visible message (information or warning) and **no** mutations on dismiss; copy is implementation discretion but must not imply deletions occurred.

---

## Errors

- **Baseline resolution failure:** Existing `BaselineResolutionError` / error message path; **no** QuickPick in that case (unchanged contract from Phase 3 integration).

---

## Out of scope (defer)

- Webview or custom tree view (**UXP-10** is v2).
- Deletion execution, confirmation dialogs for non-merged, post-run summary (**Phase 5**).

---

## Checker sign-off (extension UI)

- [ ] **Copywriting:** Baseline visible in picker chrome; row detail explains merge vs baseline in plain language.
- [ ] **Selection:** Multi-select + cancel is a no-op for repo branches.
- [ ] **No bulk-delete shortcut** in v1 UI.
- [ ] **Icons + text** both present per row.

**Approval:** pending implementation review
