import React, { type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import clsx from 'clsx';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

const inputBase = clsx(
    "bg-white dark:bg-primary-950 border border-primary-300 dark:border-primary-700 rounded-lg px-3 py-2",
    "text-sm text-primary-900 dark:text-primary-100 placeholder:text-primary-400 dark:placeholder:text-primary-600",
    "focus:outline-none focus:ring-2 focus:ring-primary-600/20 dark:focus:ring-primary-400/20 focus:border-primary-600 dark:focus:border-primary-400",
    "transition-colors w-full"
);

export const Input: React.FC<InputProps> = ({ label, error, className, id, ...props }) => {
    return (
        <div className="flex flex-col gap-1.5 w-full">
            {label && (
                <label htmlFor={id} className="text-sm font-semibold text-primary-700 dark:text-primary-300">
                    {label}
                </label>
            )}
            <input
                id={id}
                className={clsx(
                    inputBase,
                    error && "border-danger-500 focus:border-danger-500 focus:ring-danger-500/20",
                    className
                )}
                {...props}
            />
            {error && <span className="text-xs text-danger-500">{error}</span>}
        </div>
    );
};

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
}

export const TextArea: React.FC<TextAreaProps> = ({ label, error, className, id, ...props }) => {
    return (
        <div className="flex flex-col gap-1.5 w-full">
            {label && (
                <label htmlFor={id} className="text-sm font-semibold text-primary-700 dark:text-primary-300">
                    {label}
                </label>
            )}
            <textarea
                id={id}
                className={clsx(
                    inputBase,
                    "min-h-[100px] resize-y",
                    error && "border-danger-500 focus:border-danger-500 focus:ring-danger-500/20",
                    className
                )}
                {...props}
            />
            {error && <span className="text-xs text-danger-500">{error}</span>}
        </div>
    );
};
