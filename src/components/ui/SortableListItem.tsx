import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from './Card';
import { DragHandle } from './DragHandle';

interface SortableListItemProps {
    id: string;
    children: React.ReactNode;
    hoverable?: boolean;
    onClick?: () => void;
    className?: string;
}

export const SortableListItem: React.FC<SortableListItemProps> = ({ id, children, hoverable, onClick, className = '' }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} className="w-full">
            <Card
                hoverable={hoverable}
                onClick={onClick}
                className={`!p-3 flex items-center gap-4 relative group/item ${onClick ? 'cursor-pointer' : ''} ${className}`}
            >
                <DragHandle variant="list" attributes={attributes} listeners={listeners} />
                {children}
            </Card>
        </div>
    );
};
