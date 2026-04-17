import { describe, it, expect } from 'vitest';
import { byOrder, byCreatedAtDesc, byUpdatedAtDesc } from '../utils/sort';

describe('byOrder', () => {
    it('sorts by explicit order ascending', () => {
        const items = [{ order: 3 }, { order: 1 }, { order: 2 }];
        expect([...items].sort(byOrder)).toEqual([{ order: 1 }, { order: 2 }, { order: 3 }]);
    });

    it('places items without order field after items with order', () => {
        const items = [{ order: undefined }, { order: 0 }, { order: 1 }];
        const sorted = [...items].sort(byOrder);
        expect(sorted[0].order).toBe(0);
        expect(sorted[1].order).toBe(1);
        expect(sorted[2].order).toBeUndefined();
    });

    it('two items without order maintain relative stability', () => {
        const a = { order: undefined };
        const b = { order: undefined };
        const sorted = [a, b].sort(byOrder);
        // Both get MAX_SAFE_INTEGER — comparator returns 0, order preserved
        expect(sorted).toHaveLength(2);
    });

    it('order: 0 sorts before order: 1', () => {
        const items = [{ order: 1 }, { order: 0 }];
        expect([...items].sort(byOrder)[0].order).toBe(0);
    });
});

describe('byCreatedAtDesc', () => {
    it('sorts newest first', () => {
        const items = [{ createdAt: 100 }, { createdAt: 300 }, { createdAt: 200 }];
        const sorted = [...items].sort(byCreatedAtDesc);
        expect(sorted.map(i => i.createdAt)).toEqual([300, 200, 100]);
    });

    it('equal timestamps produce no change', () => {
        const items = [{ createdAt: 500 }, { createdAt: 500 }];
        expect([...items].sort(byCreatedAtDesc)).toHaveLength(2);
    });
});

describe('byUpdatedAtDesc', () => {
    it('sorts most recently updated first', () => {
        const items = [{ updatedAt: 1 }, { updatedAt: 3 }, { updatedAt: 2 }];
        const sorted = [...items].sort(byUpdatedAtDesc);
        expect(sorted.map(i => i.updatedAt)).toEqual([3, 2, 1]);
    });
});
