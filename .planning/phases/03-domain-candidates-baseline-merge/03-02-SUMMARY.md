---
phase: 03-domain-candidates-baseline-merge
plan: 02
subsystem: extension
tags: [vscode-git, merge-base, vitest, orchestration]

requires:
  - phase: 03-domain-candidates-baseline-merge
    provides: Domain baseline resolution, candidates, mergeSemantics
provides:
  - resolveBaselineForRun using Repository.getRefs snapshot
  - buildCleanupRunPlan with single baseline ref and per-candidate merge labels
  - Cleanup Branches command summary message (no QuickPick)
affects: [phase-04]

tech-stack:
  added: []
  patterns: [Thin git adapters over vscode.git; unknown on getMergeBase failure]

key-files:
  created:
    - src/git/baselineResolver.ts
    - src/git/mergeClassification.ts
    - src/git/cleanupRun.ts
    - src/domain/mergeSemantics.ts
    - src/domain/mergeSemantics.test.ts
    - src/git/mergeClassification.test.ts
  modified:
    - src/extension.ts
    - src/git/branches.ts

key-decisions:
  - "listLocalBranches uses type-only CancellationToken import so Vitest can load cleanupRun without the vscode runtime module."
  - "getRefs uses pattern refs/remotes/origin/* per RefQuery typing (no remote flag on getRefs)."

patterns-established:
  - "classifyMergeForCandidate maps getMergeBase + tip OID through mergeLabelFromMergeBase; errors and missing tips yield unknown."

requirements-completed: [DOM-03, DOM-04, QUAL-01]

duration: 20min
completed: 2026-04-14
---

# Phase 03: Domain — Plan 02 summary

**vscode.git getRefs + getMergeBase adapters feed the pure domain so one baseline drives every row, with Vitest mocks proving unknown paths and shared baseline ref reuse.**

## Performance

- **Duration:** ~20 min
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- **resolveBaselineForRun** maps remote refs into domain snapshots and resolves baseline once per run.
- **buildCleanupRunPlan** lists abandoned candidates and classifies merge state with a single `baseline.ref`.
- **Cleanup Branches** shows an information message with baseline label and merged/not merged/unknown counts; baseline resolution errors show a Branch Cleaner error message.

## Task Commits

1. **Task 1: mergeSemantics + baselineResolver** — `0ac0e19`
2. **Task 2: mergeClassification + cleanupRun + extension + branches** — `5d35519`

## Files Created/Modified

- `src/git/baselineResolver.ts` — getRefs → domain baseline
- `src/domain/mergeSemantics.ts` — D-06 merge label mapping
- `src/git/mergeClassification.ts` — getMergeBase wrapper
- `src/git/cleanupRun.ts` — buildCleanupRunPlan orchestration
- `src/git/mergeClassification.test.ts` — Mocked repository matrix
- `src/extension.ts` — Uses buildCleanupRunPlan for messaging

## Self-Check: PASSED

- `npm run test:unit` — exit 0
- `npm run compile` — exit 0
