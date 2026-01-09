import { describe, it, expect } from 'vitest';
import { cn } from '../utils';

describe('cn (classname utility)', () => {
  it('merges simple class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('handles conditional classes', () => {
    expect(cn('base', true && 'conditional')).toBe('base conditional');
    expect(cn('base', false && 'conditional')).toBe('base');
  });

  it('handles arrays of classes', () => {
    expect(cn(['foo', 'bar'], 'baz')).toBe('foo bar baz');
  });

  it('handles object syntax', () => {
    expect(cn({ foo: true, bar: false, baz: true })).toBe('foo baz');
  });

  it('resolves Tailwind conflicts (later class wins)', () => {
    // twMerge should resolve conflicts
    expect(cn('p-2', 'p-4')).toBe('p-4');
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });

  it('handles undefined and null', () => {
    expect(cn('foo', undefined, 'bar', null)).toBe('foo bar');
  });

  it('handles empty string', () => {
    expect(cn('foo', '', 'bar')).toBe('foo bar');
  });

  it('handles complex Tailwind class merging', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
    expect(cn('bg-red-500 hover:bg-red-600', 'bg-blue-500')).toBe('hover:bg-red-600 bg-blue-500');
  });

  it('preserves non-conflicting classes', () => {
    expect(cn('rounded-lg', 'shadow-md', 'p-4')).toBe('rounded-lg shadow-md p-4');
  });

  it('handles responsive prefixes', () => {
    expect(cn('sm:p-2', 'sm:p-4')).toBe('sm:p-4');
    expect(cn('md:text-sm', 'lg:text-lg')).toBe('md:text-sm lg:text-lg');
  });
});
