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

/**
 * Build canonical `refs/remotes/origin/...` from `Repository.getRefs` / `Ref` fields.
 * The Git extension sometimes uses `name: "main"` and sometimes `name: "origin/main"` for
 * the same remote; naive concatenation would yield `refs/remotes/origin/origin/HEAD`.
 */
export function normalizeOriginRemoteFullRef(remote: string, name: string): string {
  const n = name.trim();
  if (n.startsWith('refs/')) {
    return n;
  }
  if (n.startsWith(`${remote}/`)) {
    return `refs/remotes/${n}`;
  }
  return `refs/remotes/${remote}/${n}`;
}

export function mapRepositoryRefsToRemoteSnapshots(refs: readonly Ref[]): RemoteRefSnapshot[] {
  const out: RemoteRefSnapshot[] = [];
  for (const ref of refs) {
    if (ref.type !== REF_TYPE_REMOTE_HEAD) {
      continue;
    }
    if (ref.remote !== 'origin' || !ref.name) {
      continue;
    }
    const full = normalizeOriginRemoteFullRef(ref.remote, ref.name);
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
