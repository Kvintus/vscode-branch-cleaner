/**
 * Maps merge-base output to a row label (D-06). Squash/rebase nuance is out of scope for v1 (D-07).
 */
export function mergeLabelFromMergeBase(
  candidateTipOid: string,
  mergeBaseOid: string | undefined,
): 'merged' | 'not_merged' | 'unknown' {
  if (mergeBaseOid === undefined) {
    return 'unknown';
  }
  return mergeBaseOid === candidateTipOid ? 'merged' : 'not_merged';
}
