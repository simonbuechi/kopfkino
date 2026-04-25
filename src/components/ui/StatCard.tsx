import React from 'react';

interface StatCardProps {
    label: string;
    count: React.ReactNode;
    subCount?: string;
    icon: React.ReactNode;
    iconClassName?: string;
    action?: React.ReactNode;
}

export const StatCard: React.FC<StatCardProps> = ({ label, count, subCount, icon, iconClassName = '', action }) => (
    <div className="bg-white dark:bg-primary-900 border border-primary-200 dark:border-primary-800 rounded-xl p-4 flex flex-col shadow-sm group">
        <div className="flex justify-between items-start mb-4">
            <div>
                <p className="text-sm font-semibold text-primary-500 dark:text-primary-400 mb-1">{label}</p>
                <p className="text-2xl font-bold text-primary-900 dark:text-white leading-none">{count}</p>
                {subCount && (
                    <p className="text-xs font-semibold text-primary-400 dark:text-primary-500 mt-1">{subCount}</p>
                )}
            </div>
            <div className={`p-3 rounded-lg ${iconClassName}`}>{icon}</div>
        </div>
        {action ?? <div className="h-9 mt-auto" />}
    </div>
);

interface StatCardActionProps {
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
}

export const StatCardAction: React.FC<StatCardActionProps> = ({ onClick, icon, label }) => (
    <button
        onClick={onClick}
        className="flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-md bg-primary-50 dark:bg-primary-800/50 hover:bg-primary-100 dark:hover:bg-primary-800 text-sm font-semibold text-primary-600 dark:text-primary-300 transition-colors border border-primary-200 dark:border-primary-700 mt-auto"
    >
        {icon}{label}
    </button>
);
