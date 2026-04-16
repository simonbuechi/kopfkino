import React from 'react';
import { LayoutGrid, List } from 'lucide-react';

type ViewMode = 'expanded' | 'slim';

interface ViewToggleProps {
    value: ViewMode;
    onChange: (mode: ViewMode) => void;
}

export const ViewToggle: React.FC<ViewToggleProps> = ({ value, onChange }) => (
    <div className="flex bg-primary-100 dark:bg-primary-800 rounded-lg p-1 mr-2">
        <button
            onClick={() => onChange('expanded')}
            className={`p-1.5 rounded-md transition-all ${value === 'expanded'
                ? 'bg-white dark:bg-primary-700 text-primary-900 dark:text-white shadow-sm'
                : 'text-primary-500 hover:text-primary-700 dark:hover:text-primary-300'
            }`}
            title="Expanded View"
        >
            <LayoutGrid size={16} />
        </button>
        <button
            onClick={() => onChange('slim')}
            className={`p-1.5 rounded-md transition-all ${value === 'slim'
                ? 'bg-white dark:bg-primary-700 text-primary-900 dark:text-white shadow-sm'
                : 'text-primary-500 hover:text-primary-700 dark:hover:text-primary-300'
            }`}
            title="Slim View"
        >
            <List size={16} />
        </button>
    </div>
);
