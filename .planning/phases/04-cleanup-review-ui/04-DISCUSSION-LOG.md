# Phase 4: Cleanup review UI - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in **04-CONTEXT.md** — this log preserves the alternatives considered.

**Date:** 2026-04-14
**Phase:** 4 — Cleanup review UI
**Areas discussed:** Row presentation (merge signal + ordering)

---

## Row presentation

| Option | Description | Selected |
|--------|-------------|----------|
| Label-only / prefix | Merge state on same line as branch name | |
| Detail line | Branch as label; merge text in `detail` (combined with icons) | Yes |
| Icon only | Minimal text | |
| Text only | No icons | |

**User's choice:** Use **icons** (like the original gitcleaner-style extension) via VS Code **`QuickPickItem.iconPath`** / **`ThemeIcon`**, **plus** a **detail** line with plain-language merged / not merged / could-not-verify text tied to the baseline.

**Notes:** VS Code **1.96** (`engines.vscode` in this repo) supports **`iconPath`** on **`QuickPickItem`**.

---

## List ordering

| Option | Description | Selected |
|--------|-------------|----------|
| Alphabetical | By branch name only | |
| Merged first | Merged → not merged → unknown; alphabetical within group | Yes |
| Risk first | Not merged → unknown → merged | |

**User's choice:** **Merged first**, then **not merged**, then **unknown**; **alphabetical within each group**.

---

## Scope

- User selected **row presentation** only from the offered gray areas (picker mechanism, baseline placement, empty/cancel edge UX were not discussed in this session).
- **Deferred** items and **D-05** baseline chrome default are recorded in **04-CONTEXT.md**.

---

## Claude's Discretion

- Specific Codicon per merge state; exact detail strings; QuickPick API choice; empty-list UX.

## Deferred Ideas

- Picker API (`showQuickPick` vs `createQuickPick`).
- Baseline placement detail (default: show in picker chrome — see CONTEXT **D-05**).
- Empty list and primary-button behavior beyond requirement-level **no-op on cancel**.
