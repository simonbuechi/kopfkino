import React from 'react';
import clsx from 'clsx';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className, hoverable, ...props }) => {
    return (
        <div
            className={clsx(
                "bg-white dark:bg-primary-950 border border-primary-200 dark:border-primary-800/60 rounded-xl p-6 overflow-hidden shadow-sm",
                hoverable && "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-primary-300 dark:hover:border-primary-700 cursor-pointer",
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
};
