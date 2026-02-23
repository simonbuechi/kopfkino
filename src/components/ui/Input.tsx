import React, { type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import clsx from 'clsx';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, className, id, ...props }) => {
    return (
        <div className="flex flex-col gap-2 w-full">
            {label && <label htmlFor={id} className="text-sm font-medium text-primary-500 dark:text-primary-400">{label}</label>}
            <input
                id={id}
                className={clsx(
                    "bg-white dark:bg-primary-900 border border-primary-200 dark:border-primary-800 rounded-lg px-3 py-2 text-sm text-primary-900 dark:text-primary-100 placeholder:text-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-950/10 dark:focus:ring-white/10 focus:border-primary-950 dark:focus:border-primary-800 transition-colors w-full",
                    error && "border-danger-500 focus:border-danger-500 focus:ring-danger-500/10",
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
        <div className="flex flex-col gap-2 w-full">
            {label && <label htmlFor={id} className="text-sm font-medium text-primary-500 dark:text-primary-400">{label}</label>}
            <textarea
                id={id}
                className={clsx(
                    "bg-white dark:bg-primary-900 border border-primary-200 dark:border-primary-800 rounded-lg px-3 py-2 text-sm text-primary-900 dark:text-primary-100 placeholder:text-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-950/10 dark:focus:ring-white/10 focus:border-primary-950 dark:focus:border-primary-800 transition-colors w-full min-h-[100px] resize-y",
                    error && "border-danger-500 focus:border-danger-500 focus:ring-danger-500/10",
                    className
                )}
                {...props}
            />
            {error && <span className="text-xs text-danger-500">{error}</span>}
        </div>
    );
};
