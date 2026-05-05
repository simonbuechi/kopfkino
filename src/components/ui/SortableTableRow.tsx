import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DragHandle } from './DragHandle';

interface SortableTableRowProps {
    id: string;
    children: React.ReactNode;
    onClick?: () => void;
    className?: string;
}

export const SortableTableRow: React.FC<SortableTableRowProps> = ({ id, children, onClick, className = '' }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            onClick={onClick}
            className={`flex items-center gap-3 px-3 py-2 border-b border-primary-100 dark:border-primary-800 last:border-b-0 bg-white dark:bg-primary-900 ${onClick ? 'hover:bg-primary-50 dark:hover:bg-primary-800/50 cursor-pointer' : 'hover:bg-primary-50/50 dark:hover:bg-primary-800/30'} transition-colors ${className}`}
        >
            <DragHandle variant="list" attributes={attributes} listeners={listeners} />
            {children}
        </div>
    );
};
