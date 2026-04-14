/**
 * Adapts `vscode.git` `Repository.getRefs` output into the domain baseline resolver.
 * Symrefs: when `origin/HEAD` shares a tip OID with exactly one remote branch (or we pick
 * lexicographically first among matches), domain resolution treats that as the resolved target.
 */
import type { Ref, Repository } from '../types/git';
import { resolveBaselineFromOriginRemoteRefs } from '../domain/baseline';
import type { RemoteRefSnapshot, ResolvedBaseline } from '../domain/types';
import { BaselineResolutionError } from '../domain/types';

const REF_TYPE_REMOTE_HEAD = 1;

export function mapRepositoryRefsToRemoteSnapshots(refs: readonly Ref[]): RemoteRefSnapshot[] {
  const out: RemoteRefSnapshot[] = [];
  for (const ref of refs) {
    if (ref.type !== REF_TYPE_REMOTE_HEAD) {
      continue;
    }
    if (ref.remote !== 'origin' || !ref.name) {
      continue;
    }
    const full = ref.name.startsWith('refs/') ? ref.name : `refs/remotes/origin/${ref.name}`;
    out.push({ name: full, commit: ref.commit, type: ref.type });
  }
  return out;
}

export async function resolveBaselineForRun(repository: Repository): Promise<ResolvedBaseline> {
  const refs = await repository.getRefs({ pattern: 'refs/remotes/origin/*' });
  const snapshots = mapRepositoryRefsToRemoteSnapshots(refs);
  try {
    return resolveBaselineFromOriginRemoteRefs(snapshots);
  } catch (err) {
    if (err instanceof BaselineResolutionError) {
      throw err;
    }
    throw err;
  }
}
