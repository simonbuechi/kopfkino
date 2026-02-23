import React, { type ButtonHTMLAttributes } from 'react';
import clsx from 'clsx';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({
    className,
    variant = 'primary',
    size = 'md',
    children,
    ...props
}) => {
    const baseStyles = "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";

    const variants = {
        primary: "bg-primary-200 text-primary-900 hover:bg-primary-300 dark:bg-primary-100 dark:text-primary-900 dark:hover:bg-primary-200 focus:ring-primary-900 dark:focus:ring-white",
        secondary: "bg-white text-primary-900 border border-primary-200 hover:bg-primary-50 dark:bg-primary-800 dark:text-primary-100 dark:border-primary-700 dark:hover:bg-primary-700 focus:ring-primary-500",
        danger: "text-danger-600 hover:bg-danger-50 dark:text-danger-400 dark:hover:bg-danger-950/30 focus:ring-danger-500",
        ghost: "hover:bg-primary-100 text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:bg-primary-800 dark:hover:text-primary-100 focus:ring-primary-500",
    };

    const sizes = {
        sm: "h-8 px-3 text-sm",
        md: "h-10 px-4 py-2",
        lg: "h-12 px-6 text-lg",
    };

    return (
        <button
            className={clsx(baseStyles, variants[variant], sizes[size], className)}
            {...props}
        >
            {children}
        </button>
    );
};
