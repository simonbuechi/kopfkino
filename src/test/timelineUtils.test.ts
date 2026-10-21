import { describe, it, expect } from 'vitest';
import {
    formatDate,
    parseDate,
    addMonths,
    addDays,
    daysBetween,
    getTimelineBounds,
    calculateBarPosition,
    getTodayOffsetPercent,
    generateTimelineTicks,
} from '../features/planning/utils/timelineUtils';
import type { Plan } from '../types/types';

describe('timelineUtils', () => {
    it('formats and parses dates reliably', () => {
        const d = parseDate('2026-06-15');
        expect(d.getFullYear()).toBe(2026);
        expect(d.getMonth()).toBe(5); // 0-indexed June
        expect(d.getDate()).toBe(15);
        expect(formatDate(d)).toBe('2026-06-15');
    });

    it('calculates days between two dates', () => {
        const d1 = parseDate('2026-06-01');
        const d2 = parseDate('2026-06-11');
        expect(daysBetween(d1, d2)).toBe(10);
    });

    it('defaults timeline bounds to 6 months when plan has no items', () => {
        const emptyPlan: Plan = {
            id: 'p1',
            projectId: 'proj1',
            name: 'Production',
            timelineMode: 'auto',
            sections: [],
            items: [],
            createdAt: 1000,
            updatedAt: 1000,
        };

        const bounds = getTimelineBounds(emptyPlan);
        const expectedEnd = addMonths(bounds.startDate, 6);
        expect(bounds.totalDays).toBe(daysBetween(bounds.startDate, expectedEnd));
    });

    it('uses manual dates when timelineMode is manual', () => {
        const manualPlan: Plan = {
            id: 'p1',
            projectId: 'proj1',
            name: 'Manual Plan',
            timelineMode: 'manual',
            manualStartDate: '2026-05-01',
            manualEndDate: '2026-08-01',
            sections: [],
            items: [],
            createdAt: 1000,
            updatedAt: 1000,
        };

        const bounds = getTimelineBounds(manualPlan);
        expect(bounds.startStr).toBe('2026-05-01');
        expect(bounds.endStr).toBe('2026-08-01');
        expect(bounds.totalDays).toBe(92);
    });

    it('calculates automatic bounds from item dates with padding', () => {
        const planWithItems: Plan = {
            id: 'p1',
            projectId: 'proj1',
            name: 'Shooting Plan',
            timelineMode: 'auto',
            sections: [],
            items: [
                {
                    id: 'i1',
                    sectionId: 'sec1',
                    name: 'Lead Actor',
                    category: 'person',
                    dates: [
                        { id: 'd1', startDate: '2026-06-10', endDate: '2026-06-15' },
                        { id: 'd2', startDate: '2026-07-01', endDate: '2026-07-20' },
                    ],
                },
            ],
            createdAt: 1000,
            updatedAt: 1000,
        };

        const bounds = getTimelineBounds(planWithItems);
        // Start should be padded by 3 days before 2026-06-10 -> 2026-06-07
        expect(bounds.startStr).toBe('2026-06-07');
        // End should be padded by 3 days after 2026-07-20 -> 2026-07-23
        expect(bounds.endStr).toBe('2026-07-23');
    });

    it('calculates bar position correctly within bounds', () => {
        const timelineStart = parseDate('2026-06-01');
        const totalDays = 100;
        const { leftPercent, widthPercent } = calculateBarPosition('2026-06-11', '2026-06-20', timelineStart, totalDays);

        // 10 days offset -> 10%
        expect(leftPercent).toBe(10);
        // 10 days duration inclusive (11th to 20th = 10 days) -> 10%
        expect(widthPercent).toBe(10);
    });

    it('generates ticks for month zoom', () => {
        const bounds = {
            startDate: parseDate('2026-05-01'),
            endDate: parseDate('2026-07-01'),
            totalDays: 61,
            startStr: '2026-05-01',
            endStr: '2026-07-01',
        };
        const ticks = generateTimelineTicks(bounds, 'month');
        expect(ticks.length).toBeGreaterThanOrEqual(2);
    });

    it('adds days correctly', () => {
        const d = parseDate('2026-06-01');
        const next = addDays(d, 5);
        expect(formatDate(next)).toBe('2026-06-06');
    });

    it('calculates today offset or null if out of range', () => {
        const pastStart = parseDate('2000-01-01');
        const offset = getTodayOffsetPercent(pastStart, 10);
        expect(offset).toBeNull();
    });
});
