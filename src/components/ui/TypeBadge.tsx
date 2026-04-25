import React from 'react';

interface TypeBadgeProps {
    label: string;
    className?: string;
}

export const TypeBadge: React.FC<TypeBadgeProps> = ({ label, className = '' }) => (
    <span className={`shrink-0 px-2 py-0.5 rounded text-xs font-semibold bg-primary-100 dark:bg-primary-800 text-primary-600 dark:text-primary-400 capitalize pointer-events-none select-none ${className}`}>
        {label}
    </span>
);
