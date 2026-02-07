import React, { type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import clsx from 'clsx';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, className, id, ...props }) => {
    return (
        <div className="flex flex-col gap-2 w-full">
            {label && <label htmlFor={id} className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{label}</label>}
            <input
                id={id}
                className={clsx(
                    "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-950/10 dark:focus:ring-white/10 focus:border-zinc-950 dark:focus:border-zinc-800 transition-colors w-full",
                    error && "border-red-500 focus:border-red-500 focus:ring-red-500/10",
                    className
                )}
                {...props}
            />
            {error && <span className="text-xs text-red-500">{error}</span>}
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
            {label && <label htmlFor={id} className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{label}</label>}
            <textarea
                id={id}
                className={clsx(
                    "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-950/10 dark:focus:ring-white/10 focus:border-zinc-950 dark:focus:border-zinc-800 transition-colors w-full min-h-[100px] resize-y",
                    error && "border-red-500 focus:border-red-500 focus:ring-red-500/10",
                    className
                )}
                {...props}
            />
            {error && <span className="text-xs text-red-500">{error}</span>}
        </div>
    );
};
