import type { Plan } from '../../../types/types';

export type ZoomLevel = 'month' | 'week' | 'day';

export const formatDate = (d: Date): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const parseDate = (str: string): Date => {
    const [y, m, d] = str.split('-').map(Number);
    return new Date(y, m - 1, d, 0, 0, 0, 0);
};

export const addDays = (d: Date, days: number): Date => {
    const result = new Date(d.getTime());
    result.setDate(result.getDate() + days);
    return result;
};

export const addMonths = (d: Date, months: number): Date => {
    const result = new Date(d.getTime());
    result.setMonth(result.getMonth() + months);
    return result;
};

export const daysBetween = (start: Date, end: Date): number => {
    const msPerDay = 1000 * 60 * 60 * 24;
    const utcStart = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
    const utcEnd = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
    return Math.round((utcEnd - utcStart) / msPerDay);
};

export interface TimelineBounds {
    startDate: Date;
    endDate: Date;
    totalDays: number;
    startStr: string;
    endStr: string;
}

export const getTimelineBounds = (plan: Plan): TimelineBounds => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

    if (plan.timelineMode === 'manual' && plan.manualStartDate && plan.manualEndDate) {
        const start = parseDate(plan.manualStartDate);
        const end = parseDate(plan.manualEndDate);
        const total = Math.max(1, daysBetween(start, end));
        return {
            startDate: start,
            endDate: end,
            totalDays: total,
            startStr: formatDate(start),
            endStr: formatDate(end),
        };
    }

    // Auto mode: find earliest start and latest end among all items
    const allStarts: number[] = [];
    const allEnds: number[] = [];

    (plan.items || []).forEach(item => {
        (item.dates || []).forEach(d => {
            if (d.startDate) allStarts.push(parseDate(d.startDate).getTime());
            if (d.endDate) allEnds.push(parseDate(d.endDate).getTime());
        });
    });

    if (allStarts.length === 0 || allEnds.length === 0) {
        // Default: 6 months from today
        const sixMonths = addMonths(today, 6);
        const total = daysBetween(today, sixMonths);
        return {
            startDate: today,
            endDate: sixMonths,
            totalDays: total,
            startStr: formatDate(today),
            endStr: formatDate(sixMonths),
        };
    }

    const minTime = Math.min(...allStarts);
    const maxTime = Math.max(...allEnds);

    // Add a small padding (3 days on each side) so bars don't touch the outer edges
    const paddedStart = addDays(new Date(minTime), -3);
    const paddedEnd = addDays(new Date(maxTime), 3);
    const total = Math.max(7, daysBetween(paddedStart, paddedEnd));

    return {
        startDate: paddedStart,
        endDate: paddedEnd,
        totalDays: total,
        startStr: formatDate(paddedStart),
        endStr: formatDate(paddedEnd),
    };
};

export const calculateBarPosition = (
    entryStartStr: string,
    entryEndStr: string,
    timelineStart: Date,
    totalDays: number
): { leftPercent: number; widthPercent: number } => {
    const entryStart = parseDate(entryStartStr);
    const entryEnd = parseDate(entryEndStr);

    const startOffset = daysBetween(timelineStart, entryStart);
    const duration = Math.max(1, daysBetween(entryStart, entryEnd) + 1); // inclusive days

    const leftPercent = Math.max(0, Math.min(100, (startOffset / totalDays) * 100));
    const rawWidthPercent = (duration / totalDays) * 100;
    const widthPercent = Math.max(0.5, Math.min(100 - leftPercent, rawWidthPercent));

    return { leftPercent, widthPercent };
};

export const getTodayOffsetPercent = (timelineStart: Date, totalDays: number): number | null => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const offset = daysBetween(timelineStart, today);
    if (offset < 0 || offset > totalDays) return null;
    return (offset / totalDays) * 100;
};

export interface HeaderTick {
    key: string;
    label: string;
    subLabel?: string;
    leftPercent: number;
    widthPercent: number;
}

export const generateTimelineTicks = (bounds: TimelineBounds, zoom: ZoomLevel): HeaderTick[] => {
    const { startDate, totalDays } = bounds;
    const ticks: HeaderTick[] = [];

    if (zoom === 'month') {
        const cur = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
        while (cur <= bounds.endDate) {
            const nextMonth = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
            const startOfBlock = cur < startDate ? startDate : cur;
            const endOfBlock = nextMonth > bounds.endDate ? bounds.endDate : nextMonth;

            const startDays = daysBetween(startDate, startOfBlock);
            const durationDays = daysBetween(startOfBlock, endOfBlock);

            if (durationDays > 0) {
                const left = (startDays / totalDays) * 100;
                const width = (durationDays / totalDays) * 100;
                ticks.push({
                    key: `m-${cur.getFullYear()}-${cur.getMonth()}`,
                    label: cur.toLocaleDateString(undefined, { month: 'short', year: 'numeric' }),
                    leftPercent: Math.max(0, left),
                    widthPercent: Math.min(100 - left, width),
                });
            }
            cur.setMonth(cur.getMonth() + 1);
        }
    } else if (zoom === 'week') {
        // Group by weeks
        let cur = new Date(startDate);
        let weekIndex = 1;
        while (cur <= bounds.endDate) {
            const weekEnd = addDays(cur, 7);
            const boundedEnd = weekEnd > bounds.endDate ? bounds.endDate : weekEnd;
            const startDays = daysBetween(startDate, cur);
            const durationDays = daysBetween(cur, boundedEnd);

            if (durationDays > 0) {
                const left = (startDays / totalDays) * 100;
                const width = (durationDays / totalDays) * 100;
                ticks.push({
                    key: `w-${formatDate(cur)}`,
                    label: `W${weekIndex}`,
                    subLabel: `${cur.toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })}`,
                    leftPercent: Math.max(0, left),
                    widthPercent: Math.min(100 - left, width),
                });
            }
            cur = weekEnd;
            weekIndex++;
        }
    } else {
        // Day zoom (for detailed spans)
        let cur = new Date(startDate);
        while (cur <= bounds.endDate) {
            const startDays = daysBetween(startDate, cur);
            const left = (startDays / totalDays) * 100;
            const width = (1 / totalDays) * 100;
            ticks.push({
                key: `d-${formatDate(cur)}`,
                label: String(cur.getDate()),
                subLabel: cur.toLocaleDateString(undefined, { weekday: 'narrow' }),
                leftPercent: Math.max(0, left),
                widthPercent: Math.max(0.2, width),
            });
            cur = addDays(cur, 1);
        }
    }

    return ticks;
};
