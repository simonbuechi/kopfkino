import React, { type ButtonHTMLAttributes } from 'react';
import clsx from 'clsx';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg' | 'icon';
}

export const Button: React.FC<ButtonProps> = ({
    className,
    variant = 'primary',
    size = 'md',
    children,
    ...props
}) => {
    const base = clsx(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors",
        "focus-visible:outline-2 focus-visible:outline-offset-2",
        "disabled:opacity-50 disabled:cursor-not-allowed"
    );

    const variants = {
        primary: clsx(
            "btn-primary text-white",
            "focus-visible:outline-[#9123A6]"
        ),
        secondary: clsx(
            "bg-white text-primary-700 ring-1 ring-inset ring-primary-300 hover:bg-primary-50 active:bg-primary-100",
            "dark:bg-primary-900 dark:text-primary-200 dark:ring-primary-700 dark:hover:bg-primary-800 dark:active:bg-primary-700",
            "focus-visible:outline-secondary-600 dark:focus-visible:outline-secondary-400"
        ),
        outline: clsx(
            "bg-transparent text-primary-700 ring-1 ring-inset ring-primary-300 hover:bg-primary-50 active:bg-primary-100",
            "dark:text-primary-300 dark:ring-primary-600 dark:hover:bg-primary-900/50 dark:active:bg-primary-900",
            "focus-visible:outline-secondary-600"
        ),
        danger: clsx(
            "bg-transparent text-danger-600 ring-1 ring-inset ring-danger-400 hover:bg-danger-50 active:bg-danger-100",
            "dark:text-danger-400 dark:ring-danger-500 dark:hover:bg-danger-950 dark:active:bg-danger-900",
            "focus-visible:outline-danger-600"
        ),
        ghost: clsx(
            "text-primary-600 hover:bg-primary-50 hover:text-primary-700 active:bg-primary-100",
            "dark:text-primary-400 dark:hover:bg-primary-900/60 dark:hover:text-primary-300",
            "focus-visible:outline-secondary-600"
        ),
    };

    const sizes = {
        sm:   "h-8 px-3 text-sm",
        md:   "h-10 px-4 text-sm",
        lg:   "h-12 px-6 text-base",
        icon: "h-9 w-9 p-0",
    };

    return (
        <button
            className={clsx(base, variants[variant], sizes[size], className)}
            {...props}
        >
            {children}
        </button>
    );
};
