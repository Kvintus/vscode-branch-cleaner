---
phase: 04-cleanup-review-ui
plan: 04-02
status: complete
completed: "2026-04-14"
---

# Plan 04-02 Summary: Vitest and regression gates for Phase 4

## Objective

Lock sort and merge-detail copy with Vitest; add CI-style grep gates for no `deleteBranch` in extension, baseline in QuickPick title, and no misleading delete-all command metadata.

## Completed

- Added `src/git/cleanupReviewPick.test.ts` covering `mergeDetailLine` literals for `origin/main` and `sortCandidatesForReview` ordering (hotfix, zzz, feature, alpha).
- Added aggregate `"test": "npm run test:unit"` script to `package.json` (was absent).
- Verified: full `npm run test:unit` and `npm run compile` green; extension has `Branch Cleaner — baseline:` in QuickPick title; no `deleteBranch(` in `src/extension.ts`; no `"title": "Delete All` in `package.json`.

## Key files

- `src/git/cleanupReviewPick.test.ts` (created)
- `package.json` (test script)

## Deviations

None.

## Self-Check

- PASS — all unit tests pass; compile green.

## key-files.created

- `src/git/cleanupReviewPick.test.ts`

## key-files.modified

- `package.json`
