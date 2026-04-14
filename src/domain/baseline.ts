import { BaselineResolutionError, type RemoteRefSnapshot, type ResolvedBaseline } from './types';

const ORIGIN_PREFIX = 'refs/remotes/origin/';

function originShortName(fullRef: string): string | undefined {
  if (!fullRef.startsWith(ORIGIN_PREFIX)) {
    return undefined;
  }
  return fullRef.slice(ORIGIN_PREFIX.length);
}

/**
 * Ordered ref names for D-04 ladder tests (HEAD sentinel first, then fixed tiers, then stable sort).
 */
export function orderBaselineFallbacks(refs: readonly RemoteRefSnapshot[]): string[] {
  const names = new Set(refs.map((r) => r.name));
  const ordered: string[] = [`${ORIGIN_PREFIX}HEAD`, `${ORIGIN_PREFIX}main`, `${ORIGIN_PREFIX}master`];
  const rest = refs
    .map((r) => r.name)
    .filter((n) => {
      const short = originShortName(n);
      return Boolean(short) && short !== 'HEAD' && !ordered.includes(n);
    })
    .sort((a, b) => a.localeCompare(b));
  return [...ordered, ...rest.filter((n) => names.has(n))];
}

function pickResolved(ref: string, commit: string | undefined): ResolvedBaseline | undefined {
  if (!commit) {
    return undefined;
  }
  const short = originShortName(ref);
  if (!short) {
    return undefined;
  }
  return { ref, displayLabel: `origin/${short}` };
}

/**
 * Resolve integration baseline from an in-memory snapshot of `refs/remotes/origin/*` (D-04).
 */
export function resolveBaselineFromOriginRemoteRefs(
  refs: readonly RemoteRefSnapshot[],
): ResolvedBaseline {
  const byName = new Map(refs.map((r) => [r.name, r]));

  const head = byName.get(`${ORIGIN_PREFIX}HEAD`);
  if (head?.commit) {
    const matches = refs.filter((r) => {
      const short = originShortName(r.name);
      return short !== undefined && short !== 'HEAD' && r.commit === head.commit;
    });
    if (matches.length > 0) {
      matches.sort((a, b) => a.name.localeCompare(b.name));
      const picked = matches[0]!;
      const resolved = pickResolved(picked.name, picked.commit);
      if (resolved) {
        return resolved;
      }
    }
  }

  const fixedOrder = [`${ORIGIN_PREFIX}main`, `${ORIGIN_PREFIX}master`];
  for (const name of fixedOrder) {
    const row = byName.get(name);
    const resolved = pickResolved(name, row?.commit);
    if (resolved) {
      return resolved;
    }
  }

  const sortedCandidates = refs
    .filter((r) => {
      const short = originShortName(r.name);
      return Boolean(short) && short !== 'HEAD' && Boolean(r.commit);
    })
    .map((r) => r.name)
    .sort((a, b) => a.localeCompare(b));

  for (const name of sortedCandidates) {
    const row = byName.get(name);
    const resolved = pickResolved(name, row?.commit);
    if (resolved) {
      return resolved;
    }
  }

  throw new BaselineResolutionError('cannot_resolve_default_branch');
}
