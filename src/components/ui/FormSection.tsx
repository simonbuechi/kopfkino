import React from 'react';
import clsx from 'clsx';

interface FormSectionProps {
    title: React.ReactNode;
    children: React.ReactNode;
    className?: string;
}

export const FormSection: React.FC<FormSectionProps> = ({ title, children, className }) => (
    <section className={clsx('flex flex-col gap-2', className)}>
        <h3 className="font-semibold text-primary-900 dark:text-white">{title}</h3>
        {children}
    </section>
);
