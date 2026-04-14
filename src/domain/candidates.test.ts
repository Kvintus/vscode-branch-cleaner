import { describe, expect, it } from 'vitest';
import { isAbandonedCandidate, listCleanupCandidates } from './candidates';
import type { LocalBranchLike } from './types';

describe('isAbandonedCandidate', () => {
  it('treats missing upstream as abandoned', () => {
    const b: LocalBranchLike = { name: 'topic', commit: 'abc' };
    expect(isAbandonedCandidate(b)).toBe(true);
  });

  it('treats upstream without commit as abandoned', () => {
    const b: LocalBranchLike = {
      name: 'topic',
      commit: 'abc',
      upstream: { remote: 'origin', name: 'topic' },
    };
    expect(isAbandonedCandidate(b)).toBe(true);
  });

  it('treats non-origin upstream as abandoned', () => {
    const b: LocalBranchLike = {
      name: 'topic',
      commit: 'abc',
      upstream: { remote: 'upstream', name: 'topic', commit: 'def' },
    };
    expect(isAbandonedCandidate(b)).toBe(true);
  });

  it('treats healthy origin upstream as not abandoned', () => {
    const b: LocalBranchLike = {
      name: 'topic',
      commit: 'abc',
      upstream: { remote: 'origin', name: 'topic', commit: 'def' },
    };
    expect(isAbandonedCandidate(b)).toBe(false);
  });
});

describe('listCleanupCandidates', () => {
  it('excludes the current HEAD branch even when abandoned', () => {
    const branches: LocalBranchLike[] = [
      {
        name: 'current-feature',
        commit: '1',
        upstream: undefined,
      },
      { name: 'other', commit: '2', upstream: undefined },
    ];
    const out = listCleanupCandidates(branches, 'current-feature');
    expect(out.map((b: LocalBranchLike) => b.name)).toEqual(['other']);
  });

  it('excludes healthy tracked branches', () => {
    const branches: LocalBranchLike[] = [
      {
        name: 'stable',
        commit: '1',
        upstream: { remote: 'origin', name: 'stable', commit: '1' },
      },
      { name: 'orphan', commit: '2', upstream: undefined },
    ];
    const out = listCleanupCandidates(branches, 'stable');
    expect(out.map((b: LocalBranchLike) => b.name)).toEqual(['orphan']);
  });

  it('with detached HEAD (no current name), only filters by abandonment', () => {
    const branches: LocalBranchLike[] = [
      { name: 'a', commit: '1', upstream: undefined },
      { name: 'b', commit: '2', upstream: undefined },
    ];
    const out = listCleanupCandidates(branches, undefined);
    expect(out.map((b: LocalBranchLike) => b.name).sort()).toEqual(['a', 'b']);
  });
});
