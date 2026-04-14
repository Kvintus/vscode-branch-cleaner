import { describe, expect, it } from 'vitest';
import type { CleanupCandidateRow } from './cleanupRun';
import { mergeDetailLine, sortCandidatesForReview } from './cleanupReviewPick';

describe('mergeDetailLine', () => {
  const baseline = 'origin/main';

  it('formats merged state', () => {
    expect(mergeDetailLine('merged', baseline)).toBe('Merged into baseline: origin/main.');
  });

  it('formats not_merged state', () => {
    expect(mergeDetailLine('not_merged', baseline)).toBe('Not merged into baseline: origin/main.');
  });

  it('formats unknown state', () => {
    expect(mergeDetailLine('unknown', baseline)).toBe(
      'Could not verify merge into baseline: origin/main.',
    );
  });
});

describe('sortCandidatesForReview', () => {
  it('orders merged first (A–Z), then not_merged, then unknown', () => {
    const rows: CleanupCandidateRow[] = [
      { branch: { name: 'feature' }, merge: 'not_merged' },
      { branch: { name: 'hotfix' }, merge: 'merged' },
      { branch: { name: 'zzz' }, merge: 'merged' },
      { branch: { name: 'alpha' }, merge: 'unknown' },
    ];
    const sorted = sortCandidatesForReview(rows);
    expect(sorted.map((r) => r.branch.name)).toEqual(['hotfix', 'zzz', 'feature', 'alpha']);
  });
});
