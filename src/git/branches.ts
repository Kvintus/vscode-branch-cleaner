import type { CancellationToken } from 'vscode';
import type { Branch, Ref, Repository } from '../types/git';

/** Matches `RefType.Head` in `src/types/git.d.ts` (const enum — no runtime import). */
const REF_TYPE_HEAD = 0;

export interface LocalBranchSummary {
  readonly name: string;
  readonly commit?: string;
  readonly upstream?: {
    readonly remote: string;
    readonly name: string;
    readonly commit?: string;
  };
  readonly ahead?: number;
  readonly behind?: number;
}

function isLocalHead(ref: Ref): ref is Branch {
  return ref.type === REF_TYPE_HEAD && Boolean(ref.name);
}

export async function listLocalBranches(
  repository: Repository,
  token?: CancellationToken,
): Promise<LocalBranchSummary[]> {
  const refs = await repository.getBranches({ remote: false }, token);
  return refs.filter(isLocalHead).map((b) => ({
    name: b.name as string,
    commit: b.commit,
    upstream: b.upstream
      ? {
          remote: b.upstream.remote,
          name: b.upstream.name,
          commit: b.upstream.commit,
        }
      : undefined,
    ahead: b.ahead,
    behind: b.behind,
  }));
}
