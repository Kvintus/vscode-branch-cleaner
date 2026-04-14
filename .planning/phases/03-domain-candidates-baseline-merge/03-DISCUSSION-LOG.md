# Phase 3: Domain — candidates, baseline, merge - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-14
**Phase:** 3-Domain — candidates, baseline, merge
**Areas discussed:** _(session advanced via `/gsd-next` — requirements-locked defaults; no interactive gray-area picks)_

---

## Session note

`/gsd-next` routed to discuss-phase for Phase 3. Interactive **AskUserQuestion** steps were skipped; decisions were taken from **ROADMAP**, **REQUIREMENTS** (**DOM-01–04**, **QUAL-01**), **Phase 2 CONTEXT**, and **PITFALLS** research so planning could proceed without blocking the user. Revise context anytime with `/gsd-discuss-phase 3` if product choices should change.

---

## Candidate selection

| Option | Description | Selected |
|--------|-------------|----------|
| Strict gitcleaner abandonment | No / missing / gone upstream + exclude current branch | ✓ |
| All locals as candidates | Simpler but violates DOM-01 | |
| Configurable predicates | v2 / backlog | |

**User's choice:** Requirements-aligned gitcleaner-style set (see **03-CONTEXT.md** D-01–D-03).

---

## Baseline resolution

| Option | Description | Selected |
|--------|-------------|----------|
| origin/HEAD + documented static fallbacks | Matches ROADMAP + PITFALLS | ✓ |
| Local HEAD only | Conflicts with DOM-03 | |
| User setting override | Deferred CFG-01 | |

**User's choice:** Documented order starting with **origin/HEAD** (see **03-CONTEXT.md** D-04–D-05).

---

## Merge predicate

| Option | Description | Selected |
|--------|-------------|----------|
| Ancestor / merge-base via vscode.git API | Matches pitfall doc + DOM-04 | ✓ |
| CLI `--merged` | Rejected in Phase 2 stack | |

**User's choice:** API-backed ancestry-style merged signal (see **03-CONTEXT.md** D-06–D-07).

---

## Claude's Discretion

- File layout under `src/domain/` vs `src/git/` split for baseline resolution helper.

## Deferred Ideas

- CFG baseline override, refresh-remote-default UX, worktree messaging — see **03-CONTEXT.md** `<deferred>`.
