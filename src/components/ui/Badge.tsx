import React from 'react';
import clsx from 'clsx';

export type BadgeColor = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'blue';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    color?: BadgeColor;
}

const colorMap: Record<BadgeColor, string> = {
    neutral: 'bg-primary-100 text-primary-600 ring-primary-200/60 dark:bg-primary-800/60 dark:text-primary-400 dark:ring-primary-700/50',
    primary: 'bg-primary-100 text-primary-700 ring-primary-300/60 dark:bg-primary-900/60 dark:text-primary-300 dark:ring-primary-700/50',
    success: 'bg-emerald-50 text-emerald-700 ring-emerald-200/60 dark:bg-emerald-950/50 dark:text-emerald-400 dark:ring-emerald-800/50',
    warning: 'bg-amber-50 text-amber-700 ring-amber-200/60 dark:bg-amber-950/50 dark:text-amber-400 dark:ring-amber-800/50',
    danger:  'bg-danger-50 text-danger-700 ring-danger-200/60 dark:bg-danger-950/50 dark:text-danger-400 dark:ring-danger-800/50',
    blue:    'bg-blue-50 text-blue-700 ring-blue-200/60 dark:bg-blue-950/50 dark:text-blue-400 dark:ring-blue-800/50',
};

export const Badge: React.FC<BadgeProps> = ({ color = 'neutral', className, children, ...props }) => (
    <span
        className={clsx(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold ring-1 ring-inset',
            colorMap[color],
            className
        )}
        {...props}
    >
        {children}
    </span>
);
