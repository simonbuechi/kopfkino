import React from 'react';
import { GripVertical } from 'lucide-react';

interface DragHandleProps {
    variant?: 'card' | 'list';
    attributes?: React.HTMLAttributes<HTMLElement>;
    listeners?: React.HTMLAttributes<HTMLElement>;
}

export const DragHandle: React.FC<DragHandleProps> = ({ variant = 'card', attributes, listeners }) => {
    if (variant === 'list') {
        return (
            <div
                {...attributes}
                {...listeners}
                className="text-primary-400 hover:text-primary-600 dark:hover:text-primary-300 cursor-grab active:cursor-grabbing"
            >
                <GripVertical size={16} />
            </div>
        );
    }

    return (
        <div
            {...attributes}
            {...listeners}
            className="absolute top-2 left-2 z-10 bg-black/40 text-white p-1.5 rounded cursor-grab active:cursor-grabbing opacity-0 group-hover/card:opacity-100 transition-opacity hover:bg-black/60"
        >
            <GripVertical size={16} />
        </div>
    );
};
