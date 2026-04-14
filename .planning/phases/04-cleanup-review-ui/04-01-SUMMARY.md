---
phase: 04-cleanup-review-ui
plan: 04-01
status: complete
completed: "2026-04-14"
---

# Plan 04-01 Summary: Cleanup review QuickPick surface

## Objective

Deliver native multi-select QuickPick review for cleanup candidates with baseline in chrome, per-row ThemeIcon + detail, deterministic sort, no deletion APIs, empty state via information message only.

## Completed

- Added `src/git/cleanupReviewPick.ts`: `mergeStateSortOrder`, `sortCandidatesForReview` (merged → not_merged → unknown, then `localeCompare` en), `mergeDetailLine` with exact baseline-interpolated sentences.
- Updated `branchCleaner.cleanupBranches` in `src/extension.ts`: empty candidates → required info prefix; non-empty → `showQuickPick` with `canPickMany: true`, title/placeHolder include baseline, icons pass/error/question; dismiss/accept paths do not mutate Git.

## Key files

- `src/git/cleanupReviewPick.ts` (created)
- `src/extension.ts` (updated)

## Deviations

None.

## Self-Check

- PASS — `npm run compile` green; no `deleteBranch` in extension path.

## key-files.created

- `src/git/cleanupReviewPick.ts`

## key-files.modified

- `src/extension.ts`
