import { describe, it, expect } from 'vitest';
import {
    DEFAULT_CATEGORIES,
    STATUS_CONFIG,
    PRIORITY_CONFIG,
    getCategoryBadgeStyle,
} from '../features/tasks/taskConstants';

describe('taskConstants', () => {
    it('defines standard film production default categories', () => {
        expect(DEFAULT_CATEGORIES).toContain('Camera');
        expect(DEFAULT_CATEGORIES).toContain('Production');
        expect(DEFAULT_CATEGORIES).toContain('Pre-Production');
        expect(DEFAULT_CATEGORIES).toContain('Lighting');
        expect(DEFAULT_CATEGORIES).toContain('Sound');
        expect(DEFAULT_CATEGORIES).toContain('Art Department');
        expect(DEFAULT_CATEGORIES).toContain('Wardrobe & Makeup');
        expect(DEFAULT_CATEGORIES).toContain('VFX');
        expect(DEFAULT_CATEGORIES).toContain('Post-Production');
    });

    it('has configs for all task statuses', () => {
        expect(STATUS_CONFIG.backlog.label).toBe('Backlog');
        expect(STATUS_CONFIG.todo.label).toBe('To Do');
        expect(STATUS_CONFIG.in_progress.label).toBe('In Progress');
        expect(STATUS_CONFIG.done.label).toBe('Done');
    });

    it('has configs for all task priorities', () => {
        expect(PRIORITY_CONFIG.high.label).toBe('High');
        expect(PRIORITY_CONFIG.medium.label).toBe('Medium');
        expect(PRIORITY_CONFIG.low.label).toBe('Low');
    });

    it('returns consistent category badge colors', () => {
        const style1 = getCategoryBadgeStyle('Camera');
        const style2 = getCategoryBadgeStyle('Camera');
        expect(style1).toBe(style2);
        expect(typeof style1).toBe('string');
        expect(style1.length).toBeGreaterThan(0);
    });
});
