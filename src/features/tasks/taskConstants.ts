import type { TaskStatus, TaskPriority } from '../../types/types';

export const DEFAULT_CATEGORIES = [
    'Pre-Production',
    'Production',
    'Camera',
    'Lighting',
    'Sound',
    'Art Department',
    'Wardrobe & Makeup',
    'VFX',
    'Post-Production',
    'General',
];

export const STATUS_CONFIG: Record<TaskStatus, { label: string; bg: string; text: string; border: string }> = {
    backlog: {
        label: 'Backlog',
        bg: 'bg-slate-100 dark:bg-slate-800/60',
        text: 'text-slate-700 dark:text-slate-300',
        border: 'border-slate-300 dark:border-slate-700',
    },
    todo: {
        label: 'To Do',
        bg: 'bg-blue-50 dark:bg-blue-950/40',
        text: 'text-blue-700 dark:text-blue-300',
        border: 'border-blue-200 dark:border-blue-800',
    },
    in_progress: {
        label: 'In Progress',
        bg: 'bg-amber-50 dark:bg-amber-950/40',
        text: 'text-amber-700 dark:text-amber-300',
        border: 'border-amber-200 dark:border-amber-800',
    },
    done: {
        label: 'Done',
        bg: 'bg-emerald-50 dark:bg-emerald-950/40',
        text: 'text-emerald-700 dark:text-emerald-300',
        border: 'border-emerald-200 dark:border-emerald-800',
    },
};

export const PRIORITY_CONFIG: Record<TaskPriority, { label: string; badgeClass: string; dotClass: string }> = {
    high: {
        label: 'High',
        badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-400 dark:border-rose-800',
        dotClass: 'bg-rose-500',
    },
    medium: {
        label: 'Medium',
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800',
        dotClass: 'bg-amber-500',
    },
    low: {
        label: 'Low',
        badgeClass: 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
        dotClass: 'bg-slate-400',
    },
};

export const CATEGORY_COLORS: string[] = [
    'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800',
    'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
    'bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border-teal-200 dark:border-teal-800',
];

export const getCategoryBadgeStyle = (category: string): string => {
    let hash = 0;
    for (let i = 0; i < category.length; i++) {
        hash = category.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % CATEGORY_COLORS.length;
    return CATEGORY_COLORS[index];
};

export type GroupByField = 'status' | 'category' | 'priority' | 'assignee';
export type SwimlaneField = 'category' | 'status' | 'priority' | 'assignee' | 'none';
