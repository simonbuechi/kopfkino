import React from 'react';

type StatBadgeColor = 'primary' | 'blue' | 'amber' | 'emerald';

interface StatBadgeProps {
    color?: StatBadgeColor;
    icon?: React.ReactNode;
    children: React.ReactNode;
}

const colorMap: Record<StatBadgeColor, string> = {
    primary: 'bg-primary-100 dark:bg-primary-800 text-primary-600 dark:text-primary-400 border-primary-200 dark:border-primary-700',
    blue:    'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 border-blue-100 dark:border-blue-800',
    amber:   'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-300 border-amber-100 dark:border-amber-800',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-300 border-emerald-100 dark:border-emerald-800',
};

export const StatBadge: React.FC<StatBadgeProps> = ({ color = 'primary', icon, children }) => (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${colorMap[color]}`}>
        {icon}
        {children}
    </div>
);
