import { describe, it, expect, vi } from 'vitest';
import type { Repository } from '../types/git';
import type { CleanupCandidateRow } from './cleanupRun';
import {
  deleteLocalBranchesSequential,
  formatDeletionReportLines,
  selectionNeedsRiskConfirmation,
} from './localBranchDeletion';

function candidate(merge: CleanupCandidateRow['merge'], name = 'branch'): CleanupCandidateRow {
  return {
    branch: { name },
    merge,
  };
}

describe('formatDeletionReportLines', () => {
  it('lists failures before successes with expected wording', () => {
    const lines = formatDeletionReportLines([
      { branchName: 'a', ok: false, errorMessage: 'x' },
      { branchName: 'b', ok: true },
    ]);
    expect(lines).toEqual(['a: failed — x', 'b: deleted']);
  });
});

describe('selectionNeedsRiskConfirmation', () => {
  it('is false when all merged', () => {
    expect(selectionNeedsRiskConfirmation([candidate('merged', 'a'), candidate('merged', 'b')])).toBe(
      false,
    );
  });

  it('is true when any not_merged or unknown', () => {
    expect(selectionNeedsRiskConfirmation([candidate('merged'), candidate('not_merged')])).toBe(true);
    expect(selectionNeedsRiskConfirmation([candidate('unknown')])).toBe(true);
  });
});

describe('deleteLocalBranchesSequential', () => {
  it('continues after a failed delete', async () => {
    let n = 0;
    const deleteBranch = vi.fn(async () => {
      n += 1;
      if (n === 2) {
        throw new Error('boom');
      }
    });
    const repository = { deleteBranch } as unknown as Repository;
    const outcomes = await deleteLocalBranchesSequential(repository, [
      { branchName: 'a', force: false },
      { branchName: 'b', force: true },
      { branchName: 'c', force: false },
    ]);
    expect(outcomes).toEqual([
      { branchName: 'a', ok: true },
      { branchName: 'b', ok: false, errorMessage: 'boom' },
      { branchName: 'c', ok: true },
    ]);
  });

  it('passes force through to deleteBranch', async () => {
    const deleteBranch = vi.fn(async () => {});
    const repository = { deleteBranch } as unknown as Repository;
    await deleteLocalBranchesSequential(repository, [
      { branchName: 'x', force: false },
      { branchName: 'y', force: true },
    ]);
    expect(deleteBranch).toHaveBeenNthCalledWith(1, 'x', false);
    expect(deleteBranch).toHaveBeenNthCalledWith(2, 'y', true);
  });
});
