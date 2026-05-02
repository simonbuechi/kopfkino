import React from 'react';
import { Loader2 } from 'lucide-react';

type SaveStatus = 'saving' | 'saved' | 'error' | null;

export const SaveStatusBadge: React.FC<{ status: SaveStatus }> = ({ status }) => {
    if (status === 'saving') return (
        <span className="text-primary-500 text-sm flex items-center gap-1">
            <Loader2 className="animate-spin" size={14} /> Saving...
        </span>
    );
    if (status === 'saved') return (
        <span className="text-green-600 dark:text-green-400 text-sm font-semibold">Saved</span>
    );
    if (status === 'error') return (
        <span className="text-danger-600 text-sm font-semibold">Error saving</span>
    );
    return null;
};
