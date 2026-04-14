import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildCleanupRunPlan } from './cleanupRun';
import type { Repository } from '../types/git';

const REF_TYPE_HEAD = 0;
const REF_TYPE_REMOTE_HEAD = 1;

function makeRepository(overrides: {
  getRefs: () => Promise<unknown[]>;
  getBranches: () => Promise<unknown[]>;
  getMergeBase: (a: string, b: string) => Promise<string | undefined>;
}): Repository {
  return {
    state: { HEAD: { name: 'main' } },
    getRefs: vi.fn(overrides.getRefs),
    getBranches: vi.fn(overrides.getBranches),
    getMergeBase: vi.fn(overrides.getMergeBase),
  } as unknown as Repository;
}

describe('buildCleanupRunPlan merge classification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('reuses the same baseline ref for two candidates in one run', async () => {
    const baselineRef = 'refs/remotes/origin/main';
    const getMergeBase = vi.fn(async (b1: string) => {
      expect(b1).toBe(baselineRef);
      return 'x';
    });
    const repository = makeRepository({
      getRefs: async () => [
        { type: REF_TYPE_REMOTE_HEAD, name: 'HEAD', remote: 'origin', commit: 'm1' },
        { type: REF_TYPE_REMOTE_HEAD, name: 'main', remote: 'origin', commit: 'm1' },
      ],
      getBranches: async () => [
        {
          type: REF_TYPE_HEAD,
          name: 'main',
          commit: 'm1',
          upstream: { remote: 'origin', name: 'main', commit: 'm1' },
        },
        { type: REF_TYPE_HEAD, name: 'a', commit: 'x', upstream: undefined },
        { type: REF_TYPE_HEAD, name: 'b', commit: 'x', upstream: undefined },
      ],
      getMergeBase,
    });

    const plan = await buildCleanupRunPlan(repository);
    expect(plan.baseline.ref).toBe(baselineRef);
    expect(plan.candidates).toHaveLength(2);
    expect(getMergeBase).toHaveBeenCalledTimes(2);
    expect(getMergeBase.mock.calls[0]![0]).toBe(baselineRef);
    expect(getMergeBase.mock.calls[1]![0]).toBe(baselineRef);
  });

  it('returns unknown when getMergeBase returns undefined', async () => {
    const repository = makeRepository({
      getRefs: async () => [
        { type: REF_TYPE_REMOTE_HEAD, name: 'HEAD', remote: 'origin', commit: 'm1' },
        { type: REF_TYPE_REMOTE_HEAD, name: 'main', remote: 'origin', commit: 'm1' },
      ],
      getBranches: async () => [
        {
          type: REF_TYPE_HEAD,
          name: 'main',
          commit: 'm1',
          upstream: { remote: 'origin', name: 'main', commit: 'm1' },
        },
        { type: REF_TYPE_HEAD, name: 'orphan', commit: 'o1', upstream: undefined },
      ],
      getMergeBase: async () => undefined,
    });

    const plan = await buildCleanupRunPlan(repository);
    expect(plan.candidates[0]!.merge).toBe('unknown');
  });

  it('returns unknown when getMergeBase throws', async () => {
    const repository = makeRepository({
      getRefs: async () => [
        { type: REF_TYPE_REMOTE_HEAD, name: 'HEAD', remote: 'origin', commit: 'm1' },
        { type: REF_TYPE_REMOTE_HEAD, name: 'main', remote: 'origin', commit: 'm1' },
      ],
      getBranches: async () => [
        {
          type: REF_TYPE_HEAD,
          name: 'main',
          commit: 'm1',
          upstream: { remote: 'origin', name: 'main', commit: 'm1' },
        },
        { type: REF_TYPE_HEAD, name: 'orphan', commit: 'o1', upstream: undefined },
      ],
      getMergeBase: async () => {
        throw new Error('merge-base failed');
      },
    });

    const plan = await buildCleanupRunPlan(repository);
    expect(plan.candidates[0]!.merge).toBe('unknown');
  });
});
