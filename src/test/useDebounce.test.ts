import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '../hooks/useDebounce';

describe('useDebounce', () => {
    beforeEach(() => { vi.useFakeTimers(); });
    afterEach(() => { vi.useRealTimers(); });

    it('returns the initial value immediately', () => {
        const { result } = renderHook(() => useDebounce('hello', 500));
        expect(result.current).toBe('hello');
    });

    it('does not update before the delay has passed', () => {
        const { result, rerender } = renderHook(
            ({ value }) => useDebounce(value, 500),
            { initialProps: { value: 'initial' } }
        );
        rerender({ value: 'updated' });
        act(() => { vi.advanceTimersByTime(499); });
        expect(result.current).toBe('initial');
    });

    it('updates after the delay has passed', () => {
        const { result, rerender } = renderHook(
            ({ value }) => useDebounce(value, 500),
            { initialProps: { value: 'initial' } }
        );
        rerender({ value: 'updated' });
        act(() => { vi.advanceTimersByTime(500); });
        expect(result.current).toBe('updated');
    });

    it('resets the timer when value changes before delay', () => {
        const { result, rerender } = renderHook(
            ({ value }) => useDebounce(value, 500),
            { initialProps: { value: 'a' } }
        );
        rerender({ value: 'b' });
        act(() => { vi.advanceTimersByTime(300); });
        rerender({ value: 'c' });
        act(() => { vi.advanceTimersByTime(300); });
        // Only 300ms since last change — should still be 'a'
        expect(result.current).toBe('a');

        act(() => { vi.advanceTimersByTime(200); });
        // Now 500ms since 'c' was set
        expect(result.current).toBe('c');
    });

    it('works with non-string types', () => {
        const { result, rerender } = renderHook(
            ({ value }) => useDebounce(value, 300),
            { initialProps: { value: 0 } }
        );
        rerender({ value: 42 });
        act(() => { vi.advanceTimersByTime(300); });
        expect(result.current).toBe(42);
    });

    it('cleans up the timer on unmount', () => {
        const clearSpy = vi.spyOn(globalThis, 'clearTimeout');
        const { rerender, unmount } = renderHook(
            ({ value }) => useDebounce(value, 500),
            { initialProps: { value: 'a' } }
        );
        rerender({ value: 'b' });
        unmount();
        expect(clearSpy).toHaveBeenCalled();
    });
});
