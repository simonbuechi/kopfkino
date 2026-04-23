import React from 'react';

interface TooltipProps {
    label: string;
    children: React.ReactNode;
}

export const Tooltip: React.FC<TooltipProps> = ({ label, children }) => (
    <div className="relative group/tooltip">
        {children}
        <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 text-xs font-medium rounded-md bg-primary-900 text-white dark:bg-primary-100 dark:text-primary-900 whitespace-nowrap pointer-events-none opacity-0 group-hover/tooltip:opacity-100 transition-opacity delay-300">
            {label}
        </span>
    </div>
);
