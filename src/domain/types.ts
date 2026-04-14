/** Remote ref row shaped like `Repository.getRefs` output after adapter normalization. */
export interface RemoteRefSnapshot {
  readonly name: string;
  readonly commit?: string;
  readonly type?: number;
}

export interface ResolvedBaseline {
  readonly ref: string;
  readonly displayLabel: string;
}

/** v1 default-remote scope: only `origin` upstream counts as “healthy” tracking. */
export interface LocalBranchLike {
  readonly name: string;
  readonly commit?: string;
  readonly upstream?: {
    readonly remote: string;
    readonly name: string;
    readonly commit?: string;
  };
}

export class BaselineResolutionError extends Error {
  readonly kind = 'no_baseline' as const;

  constructor(message = 'cannot_resolve_default_branch') {
    super(message);
    this.name = 'BaselineResolutionError';
  }
}
