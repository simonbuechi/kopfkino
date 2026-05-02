import React from 'react';
import { Edit, Trash2, GripVertical, ChevronDown, ChevronRight, Timer, Clapperboard } from 'lucide-react';
import { Tooltip } from '../../components/ui/Tooltip';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ShotSetup } from '../../types/types';
import { formatDuration } from './formatDuration';

interface SortableSetupHeaderProps {
    group: ShotSetup;
    shotCount: number;
    totalLength: number;
    collapsed: boolean;
    onToggle: () => void;
    onEdit: () => void;
    onDelete: () => void;
}

export const SortableSetupHeader: React.FC<SortableSetupHeaderProps> = ({
    group, shotCount, totalLength, collapsed, onToggle, onEdit, onDelete,
}) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: `group-${group.id}` });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style}
            className="flex items-center gap-2 px-3 py-2 bg-primary-50 dark:bg-primary-800/50 border border-primary-200 dark:border-primary-700 rounded-lg">
            <div {...attributes} {...listeners}
                className="text-primary-400 hover:text-primary-600 dark:hover:text-primary-300 cursor-grab active:cursor-grabbing p-0.5 shrink-0">
                <GripVertical size={15} />
            </div>
            <button onClick={onToggle}
                className="flex items-center gap-1.5 text-primary-500 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-200 transition-colors">
                {collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
            </button>
            <div className="flex-1 min-w-0" onClick={onToggle} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && onToggle()}>
                <span className="font-semibold text-sm text-primary-900 dark:text-primary-100 cursor-pointer">{group.name}</span>
                {group.description && (
                    <span className="ml-2 text-xs text-primary-400 dark:text-primary-500 truncate">{group.description}</span>
                )}
            </div>
            <Tooltip label="Number of shots">
                <span className="text-xs px-1.5 py-0.5 rounded bg-primary-100 dark:bg-primary-700 text-primary-500 dark:text-primary-300 font-semibold shrink-0 inline-flex items-center gap-1">
                    <Clapperboard size={10} />{shotCount}
                </span>
            </Tooltip>
            {totalLength > 0 && (
                <Tooltip label="Total length of shots">
                    <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800 font-semibold shrink-0 inline-flex items-center gap-1">
                        <Timer size={10} />{formatDuration(totalLength)}
                    </span>
                </Tooltip>
            )}
            <button onClick={onEdit}
                className="flex items-center justify-center h-6 w-6 rounded-md transition-colors text-primary-400 hover:text-primary-700 hover:bg-primary-100 dark:hover:text-primary-200 dark:hover:bg-primary-700"
                title="Edit Setup">
                <Edit size={12} />
            </button>
            <button onClick={onDelete}
                className="flex items-center justify-center h-6 w-6 rounded-md transition-colors text-primary-400 hover:text-danger-600 hover:bg-danger-50 dark:hover:text-danger-400 dark:hover:bg-danger-900/20"
                title="Delete Setup">
                <Trash2 size={12} />
            </button>
        </div>
    );
};
