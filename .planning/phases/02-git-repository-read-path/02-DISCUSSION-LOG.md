# Phase 2: Git repository read path - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-14
**Phase:** 2-Git repository read path
**Areas discussed:** Repository resolution, Branch/upstream read surface, Failure signaling, Multi-repo workspace (auto-selected)

---

## Repository resolution

| Option | Description | Selected |
|--------|-------------|----------|
| vscode.git API only | `getAPI(1)` and `Repository` list | ✓ |
| Raw Git CLI | `child_process` / simple-git | |
| Hybrid | API first, CLI escape hatch | |

**User's choice:** (auto) **vscode.git API only** — recommended default from project stack.
**Notes:** Workspace folder ↔ `rootUri` matching; multi-repo disambiguation via active editor path then first folder.

---

## Branch and upstream read surface

| Option | Description | Selected |
|--------|-------------|----------|
| `Repository.getBranches` + typed fields | Align with Git extension API | ✓ |
| Parse `git for-each-ref` via CLI | | |

**User's choice:** (auto) **`getBranches`** and documented API fields for Phase 3 consumers.
**Notes:** No candidate/baseline logic in this phase.

---

## Failure signaling

| Option | Description | Selected |
|--------|-------------|----------|
| `showErrorMessage` for blocking failures | Clear, user-visible | ✓ |
| Silent log only | | |

**User's choice:** (auto) **`showErrorMessage`** with operation context (GIT-03).

---

## Claude's Discretion

- Module/file layout under `src/`.
- Optional Output channel (default off for this phase).

## Deferred Ideas

- Baseline, merge labels, QuickPick, delete — later phases per ROADMAP.
