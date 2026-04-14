# VS Code Branch Cleaner

## What This Is

A **Visual Studio Code / Cursor extension** that recreates the workflow of the JetBrains plugin [Git Cleaner (gitcleaner)](https://github.com/PavlikPolivka/gitcleaner): run a **“Cleanup Branches”** command, review **candidate local branches** in a dialog, see **whether each branch is fully merged** into the repo’s **default integration branch** (resolved via **`origin/HEAD`** when available), and **choose which branches to delete or keep**—so you can stop opening WebStorm only for branch cleanup.

## Core Value

**Safe, explicit local branch cleanup inside the editor:** same mental model as gitcleaner (candidates, merge signal, pick what to remove), without relying on JetBrains.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] User can run a **Cleanup Branches** command from the editor.
- [ ] Extension lists **cleanup candidates** using **gitcleaner-style rules** (local branches without a usable upstream / missing remote tracking—not a generic “all locals” list).
- [ ] **Current branch** is never listed as a candidate.
- [ ] For each candidate, the UI shows **merged vs not merged** into the **default branch implied by `origin/HEAD`**, with a **sensible fallback** when `origin/HEAD` is missing or ambiguous.
- [ ] User can **select which candidates to delete** (and implicitly or explicitly **keep** the rest).
- [ ] Before delete, behavior matches gitcleaner’s safety idea: **do not delete** (or clearly block/warn on) branches that are **not fully merged** into the comparison branch, consistent with user expectations from the JetBrains flow.
- [ ] Extension is **practical in both VS Code and Cursor** (standard VS Code extension packaging and APIs).

### Out of Scope

- **Remote branch deletion** on the Git host (e.g. deleting `origin/foo` on the server) — not required for v1 parity with the described WebStorm flow.
- **Feature parity** with every edge case of the Java plugin without validation — port **the documented flow** first; defer uncommon Git states unless discovered in use.
- **Non-Git** version control — Git only.
- **JetBrains/WebStorm distribution** — this project targets VS Code/Cursor only.

## Context

- **Prior art:** [PavlikPolivka/gitcleaner](https://github.com/PavlikPolivka/gitcleaner) — “Delete Old Branches” style action: list branches **without tracking remotes**, exclude current branch, and check **merged to current branch** in the original README (here we anchor merge checks to **`origin/HEAD`** per product decision).
- **Motivation:** No satisfactory Marketplace alternative; WebStorm is kept installed almost solely for this cleanup flow.
- **Repository state:** Greenfield extension project (planning initialized in-repo).

## Constraints

- **Platform:** VS Code extension model (TypeScript), compatible with **Cursor** as a VS Code fork.
- **Git:** Must use reliable Git metadata/commands; behavior must stay predictable across macOS/Linux/Windows where VS Code runs.
- **Safety:** Prefer **clear errors and non-destructive defaults** over aggressive cleanup.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Merge baseline: **`origin/HEAD`** (remote default) | Matches modern repos; user-selected default | — Pending |
| Candidate set: **gitcleaner-style** (no / missing upstream) | Explicit user request for same behavior | — Pending |
| **Local-only** delete for v1 | User flow described as local branch pick/delete | — Pending |
| **WebStorm flow** as UX reference | Reduce re-learning and migration friction | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):

1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. “What This Is” still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):

1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-14 after initialization*
