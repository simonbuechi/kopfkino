import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from './Card';
import { DragHandle } from './DragHandle';

interface SortableCardProps {
    id: string;
    children: React.ReactNode;
    hoverable?: boolean;
    onClick?: () => void;
    className?: string;
}

export const SortableCard: React.FC<SortableCardProps> = ({ id, children, hoverable, onClick, className = '' }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} className="h-full">
            <Card
                hoverable={hoverable}
                onClick={onClick}
                className={`!p-0 flex flex-col h-full relative group/card ${onClick ? 'cursor-pointer' : ''} ${className}`}
            >
                <DragHandle variant="card" attributes={attributes} listeners={listeners} />
                {children}
            </Card>
        </div>
    );
};
