import React from 'react';

interface EmptyStateProps {
    icon: React.ReactNode;
    message: string;
    description?: string;
    action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, message, description, action }) => (
    <div className="flex flex-col items-center justify-center py-16 text-primary-500 border-2 border-dashed border-primary-200 dark:border-primary-800 rounded-xl">
        <div className="mb-4 opacity-50">{icon}</div>
        <p className="font-medium text-primary-900 dark:text-white">{message}</p>
        {description && (
            <p className="text-sm text-primary-500 dark:text-primary-400 max-w-sm text-center mt-2">{description}</p>
        )}
        {action && <div className="mt-6">{action}</div>}
    </div>
);
