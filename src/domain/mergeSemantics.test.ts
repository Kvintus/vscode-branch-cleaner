import { describe, expect, it } from 'vitest';
import { mergeLabelFromMergeBase } from './mergeSemantics';

describe('mergeLabelFromMergeBase', () => {
  it('returns merged when merge base equals candidate tip', () => {
    expect(mergeLabelFromMergeBase('abc', 'abc')).toBe('merged');
  });

  it('returns not_merged when merge base differs from candidate tip', () => {
    expect(mergeLabelFromMergeBase('abc', 'def')).toBe('not_merged');
  });

  it('returns unknown when merge base is undefined', () => {
    expect(mergeLabelFromMergeBase('abc', undefined)).toBe('unknown');
  });
});
