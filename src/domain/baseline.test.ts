import { describe, expect, it } from 'vitest';
import { orderBaselineFallbacks, resolveBaselineFromOriginRemoteRefs } from './baseline';
import { BaselineResolutionError } from './types';
import type { RemoteRefSnapshot } from './types';

const head = (commit: string): RemoteRefSnapshot => ({
  name: 'refs/remotes/origin/HEAD',
  commit,
});

const remote = (short: string, commit: string): RemoteRefSnapshot => ({
  name: `refs/remotes/origin/${short}`,
  commit,
});

describe('resolveBaselineFromOriginRemoteRefs', () => {
  it('prefers symref HEAD when it matches origin/main tip', () => {
    const refs: RemoteRefSnapshot[] = [
      head('aaa'),
      remote('main', 'aaa'),
      remote('develop', 'bbb'),
    ];
    const baseline = resolveBaselineFromOriginRemoteRefs(refs);
    expect(baseline.ref).toBe('refs/remotes/origin/main');
    expect(baseline.displayLabel).toBe('origin/main');
  });

  it('falls through main then master when HEAD is missing', () => {
    const refs: RemoteRefSnapshot[] = [remote('develop', 'x'), remote('main', 'm1')];
    const baseline = resolveBaselineFromOriginRemoteRefs(refs);
    expect(baseline.ref).toBe('refs/remotes/origin/main');
  });

  it('uses master when main is absent', () => {
    const refs: RemoteRefSnapshot[] = [remote('master', 'm1')];
    const baseline = resolveBaselineFromOriginRemoteRefs(refs);
    expect(baseline.ref).toBe('refs/remotes/origin/master');
    expect(baseline.displayLabel).toBe('origin/master');
  });

  it('uses lexicographic order among origin/* excluding HEAD as last tier', () => {
    const refs: RemoteRefSnapshot[] = [
      remote('feature/zzz', 'z1'),
      remote('feature/aaa', 'a1'),
    ];
    const baseline = resolveBaselineFromOriginRemoteRefs(refs);
    expect(baseline.ref).toBe('refs/remotes/origin/feature/aaa');
  });

  it('excludes HEAD from sorted origin/* tier', () => {
    const refs: RemoteRefSnapshot[] = [
      { name: 'refs/remotes/origin/HEAD' },
      remote('zzz-other', 'o1'),
    ];
    const baseline = resolveBaselineFromOriginRemoteRefs(refs);
    expect(baseline.ref).toBe('refs/remotes/origin/zzz-other');
  });

  it('throws BaselineResolutionError when no usable remote baseline exists', () => {
    const refs: RemoteRefSnapshot[] = [{ name: 'refs/remotes/origin/HEAD' }];
    expect(() => resolveBaselineFromOriginRemoteRefs(refs)).toThrow(BaselineResolutionError);
  });
});

describe('orderBaselineFallbacks', () => {
  it('lists HEAD, main, master, then sorted remaining refs', () => {
    const refs: RemoteRefSnapshot[] = [
      remote('feature/zzz', '1'),
      remote('feature/b', '2'),
      head('h'),
    ];
    const order = orderBaselineFallbacks(refs);
    expect(order[0]).toBe('refs/remotes/origin/HEAD');
    expect(order).toContain('refs/remotes/origin/main');
    expect(order).toContain('refs/remotes/origin/master');
    expect(order).toContain('refs/remotes/origin/feature/b');
    expect(order).toContain('refs/remotes/origin/feature/zzz');
  });
});
