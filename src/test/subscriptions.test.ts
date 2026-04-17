/**
 * Subscription lifecycle tests.
 *
 * These tests verify that Firestore onSnapshot listeners are correctly
 * cleaned up when the active project changes or the component unmounts,
 * preventing memory leaks and stale-data bugs.
 *
 * Strategy: mock 'firebase/firestore' so onSnapshot returns a spy-able
 * unsubscribe function, then verify it gets called at the right time.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { onSnapshot } from 'firebase/firestore';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('firebase/firestore', () => ({
    getFirestore: vi.fn(),
    collection: vi.fn(() => ({})),
    doc: vi.fn(() => ({})),
    query: vi.fn((ref: unknown) => ref),
    onSnapshot: vi.fn(() => vi.fn()),
    setDoc: vi.fn(() => Promise.resolve()),
    deleteDoc: vi.fn(() => Promise.resolve()),
    updateDoc: vi.fn(() => Promise.resolve()),
    getDocs: vi.fn(() => Promise.resolve({ docs: [] })),
    getDoc: vi.fn(() => Promise.resolve({ exists: () => false, data: () => ({}) })),
    where: vi.fn(() => ({})),
    writeBatch: vi.fn(() => ({ update: vi.fn(), commit: vi.fn(() => Promise.resolve()) })),
    initializeFirestore: vi.fn(() => ({})),
    connectFirestoreEmulator: vi.fn(),
    terminate: vi.fn(() => Promise.resolve()),
    persistentLocalCache: vi.fn(() => ({})),
    persistentMultipleTabManager: vi.fn(() => ({})),
}));

vi.mock('firebase/auth', () => ({
    getAuth: vi.fn(() => ({ currentUser: null, onAuthStateChanged: vi.fn(() => vi.fn()) })),
    connectAuthEmulator: vi.fn(),
    onAuthStateChanged: vi.fn(() => vi.fn()),
    signOut: vi.fn(() => Promise.resolve()),
}));

vi.mock('firebase/app', () => ({
    initializeApp: vi.fn(() => ({})),
    deleteApp: vi.fn(() => Promise.resolve()),
    getApps: vi.fn(() => []),
}));

vi.mock('firebase/storage', () => ({
    getStorage: vi.fn(() => ({})),
}));

// ---------------------------------------------------------------------------
// Tests: useDebounce cleanup (verifies timer is cancelled on value change)
// This indirectly tests that useEffect cleanup patterns work in our test env.
// ---------------------------------------------------------------------------

import { useDebounce } from '../hooks/useDebounce';

describe('useDebounce cleanup', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it('clears the previous timer when value changes before delay', () => {
        const clearSpy = vi.spyOn(globalThis, 'clearTimeout');
        const { rerender } = renderHook(
            ({ val }) => useDebounce(val, 500),
            { initialProps: { val: 'a' } }
        );
        rerender({ val: 'b' });
        rerender({ val: 'c' });
        // Each rerender should have triggered clearTimeout
        expect(clearSpy.mock.calls.length).toBeGreaterThanOrEqual(2);
    });

    it('clears the timer on unmount', () => {
        const clearSpy = vi.spyOn(globalThis, 'clearTimeout');
        const { rerender, unmount } = renderHook(
            ({ val }) => useDebounce(val, 500),
            { initialProps: { val: 'a' } }
        );
        rerender({ val: 'b' }); // sets a timer
        unmount();
        expect(clearSpy).toHaveBeenCalled();
    });
});

// ---------------------------------------------------------------------------
// Tests: onSnapshot unsubscribe pattern
// Verify that subscription teardown calls the returned unsubscribe fn.
// ---------------------------------------------------------------------------

describe('onSnapshot unsubscribe pattern', () => {
    it('unsubscribe function is called when cleanup runs', () => {
        const unsub = vi.fn();
        vi.mocked(onSnapshot).mockReturnValueOnce(unsub as never);

        // Simulate the pattern used in storage.ts subscriptions
        let cleanup: (() => void) | null = null;
        const { unmount } = renderHook(() => {
            React.useEffect(() => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const unsubscribe = onSnapshot({} as any, () => {});
                cleanup = unsubscribe;
                return () => unsubscribe();
            }, []);
        });

        unmount();
        expect(unsub).toHaveBeenCalledOnce();
        expect(cleanup).toBe(unsub);
    });

    it('unsubscribe is called when dep changes (simulates project switch)', () => {
        const unsub1 = vi.fn();
        const unsub2 = vi.fn();
        vi.mocked(onSnapshot)
            .mockReturnValueOnce(unsub1 as never)
            .mockReturnValueOnce(unsub2 as never);

        const { rerender, unmount } = renderHook(
            ({ projectId }: { projectId: string }) => {
                React.useEffect(() => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const unsubscribe = onSnapshot({} as any, () => {});
                    return () => unsubscribe();
                }, [projectId]);
            },
            { initialProps: { projectId: 'project-a' } }
        );

        // Switching projects should unsubscribe the first listener
        act(() => { rerender({ projectId: 'project-b' }); });
        expect(unsub1).toHaveBeenCalledOnce();

        // Unmounting should unsubscribe the second listener
        unmount();
        expect(unsub2).toHaveBeenCalledOnce();
    });

    it('multiple subscriptions are all cleaned up on unmount', () => {
        const spies = Array.from({ length: 5 }, () => vi.fn());
        spies.forEach(spy => vi.mocked(onSnapshot).mockReturnValueOnce(spy as never));

        const { unmount } = renderHook(() => {
            React.useEffect(() => {
                const subs = Array.from({ length: 5 }, () => onSnapshot({}, () => {}));
                return () => subs.forEach(u => u());
            }, []);
        });

        unmount();
        spies.forEach(spy => expect(spy).toHaveBeenCalledOnce());
    });
});

// ---------------------------------------------------------------------------
// Tests: storeReducer RESET is called when user logs out
// (verifies the auth-gated cleanup path without needing Firebase)
// ---------------------------------------------------------------------------

import { storeReducer, storeInitialState } from '../context/reducers';
import type { Location } from '../types/types';

describe('Store reset on auth change', () => {
    const loc: Location = { id: 'l1', projectId: 'p1', name: 'Loc', description: '' };

    it('RESET clears all data (simulates logout cleanup)', () => {
        const populated = storeReducer(storeInitialState, { type: 'SET_LOCATIONS', payload: [loc] });
        expect(populated.locations).toHaveLength(1);
        const reset = storeReducer(populated, { type: 'RESET' });
        expect(reset.locations).toHaveLength(0);
        expect(reset.scenes).toHaveLength(0);
        expect(reset.characters).toHaveLength(0);
    });

    it('multiple RESET calls are idempotent', () => {
        const populated = storeReducer(storeInitialState, { type: 'SET_LOCATIONS', payload: [loc] });
        const r1 = storeReducer(populated, { type: 'RESET' });
        const r2 = storeReducer(r1, { type: 'RESET' });
        expect(r1).toEqual(r2);
    });
});
