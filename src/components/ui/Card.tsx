import React from 'react';
import clsx from 'clsx';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className, hoverable, ...props }) => {
    return (
        <div
            className={clsx(
                "bg-white dark:bg-primary-900 border border-primary-200 dark:border-primary-800 rounded-xl p-6 overflow-hidden shadow-sm",
                hoverable && "transition-transform duration-200 hover:-translate-y-1 hover:shadow-md hover:border-primary-300 dark:hover:border-primary-700",
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
};
