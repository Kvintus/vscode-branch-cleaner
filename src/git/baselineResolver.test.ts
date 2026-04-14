import { describe, expect, it } from 'vitest';
import { mapRepositoryRefsToRemoteSnapshots, normalizeOriginRemoteFullRef } from './baselineResolver';
import type { Ref } from '../types/git';

const REF_TYPE_REMOTE_HEAD = 1;

describe('normalizeOriginRemoteFullRef', () => {
  it('returns full refs unchanged', () => {
    expect(normalizeOriginRemoteFullRef('origin', 'refs/remotes/origin/main')).toBe(
      'refs/remotes/origin/main',
    );
  });

  it('prefixes short branch names', () => {
    expect(normalizeOriginRemoteFullRef('origin', 'main')).toBe('refs/remotes/origin/main');
    expect(normalizeOriginRemoteFullRef('origin', 'HEAD')).toBe('refs/remotes/origin/HEAD');
  });

  it('does not double-prefix when name already includes remote/ (vscode.git shape)', () => {
    expect(normalizeOriginRemoteFullRef('origin', 'origin/HEAD')).toBe('refs/remotes/origin/HEAD');
    expect(normalizeOriginRemoteFullRef('origin', 'origin/main')).toBe('refs/remotes/origin/main');
  });
});

describe('mapRepositoryRefsToRemoteSnapshots', () => {
  it('normalizes origin-prefixed names from the Git extension', () => {
    const refs: Ref[] = [
      { type: REF_TYPE_REMOTE_HEAD, remote: 'origin', name: 'origin/HEAD', commit: 'a' },
      { type: REF_TYPE_REMOTE_HEAD, remote: 'origin', name: 'main', commit: 'a' },
    ];
    const snaps = mapRepositoryRefsToRemoteSnapshots(refs);
    expect(snaps.map((s) => s.name)).toEqual([
      'refs/remotes/origin/HEAD',
      'refs/remotes/origin/main',
    ]);
  });
});
