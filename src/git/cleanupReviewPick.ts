import type { CleanupCandidateRow } from './cleanupRun';

export function mergeStateSortOrder(merge: CleanupCandidateRow['merge']): number {
  switch (merge) {
    case 'merged':
      return 0;
    case 'not_merged':
      return 1;
    case 'unknown':
      return 2;
  }
}

export function sortCandidatesForReview(rows: readonly CleanupCandidateRow[]): CleanupCandidateRow[] {
  return [...rows].sort((a, b) => {
    const byMerge = mergeStateSortOrder(a.merge) - mergeStateSortOrder(b.merge);
    if (byMerge !== 0) {
      return byMerge;
    }
    return a.branch.name.localeCompare(b.branch.name, 'en');
  });
}

export function mergeDetailLine(merge: CleanupCandidateRow['merge'], baselineDisplayLabel: string): string {
  switch (merge) {
    case 'merged':
      return `Merged into baseline: ${baselineDisplayLabel}.`;
    case 'not_merged':
      return `Not merged into baseline: ${baselineDisplayLabel}.`;
    case 'unknown':
      return `Could not verify merge into baseline: ${baselineDisplayLabel}.`;
  }
}
