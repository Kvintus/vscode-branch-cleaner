---
phase: 5
slug: safety-local-deletion-and-outcomes
status: draft
platform: vscode-native
created: 2026-04-14
---

# Phase 5 — UI Design Contract (post-delete outcomes + confirmations)

> Contract for **modal** confirmations and **post-run summary** after QuickPick selection. Uses **`vscode.window` message APIs** only (no webview). Implements `05-CONTEXT.md` **D-01–D-04** and **SAFE-03**.

---

## Surfaces

| Step | API | When |
|------|-----|------|
| Non-merged / unknown gate | `vscode.window.showWarningMessage` with `{ modal: true }` | After QuickPick, if any selected candidate has `merge` in `not_merged`, `unknown` |
| Success-only summary | `vscode.window.showInformationMessage` with `{ modal: true }` | After all `deleteBranch` attempts succeed |
| Partial or full failure summary | `vscode.window.showWarningMessage` or `showErrorMessage` with `{ modal: true }` | After attempts, if **any** deletion failed (**D-04**) |

---

## Pre-delete confirmation (SAFE-01)

- **Scope:** Only when the selected set includes at least one **`not_merged`** or **`unknown`** row (per domain labels).
- **Content must include:** Resolved **baseline** string matching **`plan.baseline.displayLabel`** (same as QuickPick title context).
- **Branch list:** Name each risky branch; merge wording must **not contradict** QuickPick (`mergeDetailLine` meaning).
- **Actions:** Default-safe **Cancel**; explicit confirm action to proceed (exact labels implementation discretion).
- **Cancel:** No `deleteBranch` calls; no summary modal for deletes.

---

## Post-delete summary (SAFE-03, D-01–D-04)

- **Always** show a modal after a run that performed at least one `deleteBranch` attempt (including when all succeed — **D-02**).
- **Body:** Enough lines to list **each branch** outcome (success or failure with reason text from caught errors — **D-01**).
- **Order:** **Failures first**, then successes (**D-03**).
- **Severity:** If **any** failure → warning- or error-level API (**D-04**). If **all** success → information-level (**D-04**).

---

## Copy and truncation

- Prefer full branch names; if message length is a concern, implementation may truncate with ellipsis but must not drop failure lines silently (**SAFE-03**).

---

## Out of scope

- QuickPick review layout (Phase **04**).
- Output channel / clipboard (**optional** secondary; not required for contract compliance).

---

## Checker sign-off

- [ ] Modal used for summary and for non-merged gate.
- [ ] Failures-first ordering; elevated severity when any failure.
- [ ] Baseline referenced in non-merged confirmation.

**Approval:** pending implementation review
