import React from 'react';

interface PageHeaderProps {
    title: string;
    actions?: React.ReactNode;
    className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, actions, className = '' }) => (
    <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${className}`}>
        <h2 className="text-3xl font-bold text-primary-900 dark:text-white">{title}</h2>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
);
