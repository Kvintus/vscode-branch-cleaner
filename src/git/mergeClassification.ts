import type { Repository } from '../types/git';
import type { LocalBranchSummary } from './branches';
import { mergeLabelFromMergeBase } from '../domain/mergeSemantics';

export async function classifyMergeForCandidate(
  repository: Repository,
  baselineRef: string,
  candidate: LocalBranchSummary,
): Promise<'merged' | 'not_merged' | 'unknown'> {
  if (!candidate.commit || candidate.commit === '') {
    return 'unknown';
  }
  const candidateRef = `refs/heads/${candidate.name}`;
  try {
    const mergeBaseOid = await repository.getMergeBase(baselineRef, candidateRef);
    return mergeLabelFromMergeBase(candidate.commit, mergeBaseOid);
  } catch {
    return 'unknown';
  }
}
