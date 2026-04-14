import type { CancellationToken } from 'vscode';
import type { Repository } from '../types/git';
import type { ResolvedBaseline } from '../domain/types';
import { listCleanupCandidates } from '../domain/candidates';
import { listLocalBranches, type LocalBranchSummary } from './branches';
import { resolveBaselineForRun } from './baselineResolver';
import { classifyMergeForCandidate } from './mergeClassification';

export type CleanupCandidateRow = {
  readonly branch: LocalBranchSummary;
  readonly merge: 'merged' | 'not_merged' | 'unknown';
};

export async function buildCleanupRunPlan(
  repository: Repository,
  token?: CancellationToken,
): Promise<{ baseline: ResolvedBaseline; candidates: readonly CleanupCandidateRow[] }> {
  const branches = await listLocalBranches(repository, token);
  const currentHeadName = repository.state.HEAD?.name;
  const abandoned = listCleanupCandidates(branches, currentHeadName);
  const baseline = await resolveBaselineForRun(repository);
  const candidates: CleanupCandidateRow[] = [];
  for (const branch of abandoned) {
    const merge = await classifyMergeForCandidate(repository, baseline.ref, branch);
    candidates.push({ branch, merge });
  }
  return { baseline, candidates };
}
