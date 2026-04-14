import type { LocalBranchLike } from './types';

/**
 * gitcleaner-style abandonment for v1: no upstream, missing tip on upstream, or upstream
 * not tracked against the default remote `origin`.
 */
export function isAbandonedCandidate(branch: LocalBranchLike): boolean {
  const upstream = branch.upstream;
  if (!upstream) {
    return true;
  }
  if (!upstream.commit || upstream.commit === '') {
    return true;
  }
  if (upstream.remote !== 'origin') {
    return true;
  }
  return false;
}

/**
 * Returns abandoned locals, excluding the current HEAD branch by short name when known.
 */
export function listCleanupCandidates(
  branches: readonly LocalBranchLike[],
  currentHeadName: string | undefined,
): readonly LocalBranchLike[] {
  return branches.filter((branch) => {
    if (currentHeadName !== undefined && branch.name === currentHeadName) {
      return false;
    }
    return isAbandonedCandidate(branch);
  });
}
