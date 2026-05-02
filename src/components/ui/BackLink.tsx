import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface BackLinkProps {
    to: string;
    label: string;
}

export const BackLink: React.FC<BackLinkProps> = ({ to, label }) => (
    <Link
        to={to}
        className="inline-flex items-center gap-2 h-8 px-3 -ml-3 text-sm font-semibold rounded-lg transition-colors text-primary-500 hover:text-primary-900 hover:bg-primary-50 dark:text-primary-400 dark:hover:text-primary-100 dark:hover:bg-primary-900/60"
    >
        <ArrowLeft size={16} /> {label}
    </Link>
);
