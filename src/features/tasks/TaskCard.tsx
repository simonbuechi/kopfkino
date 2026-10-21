import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import {
    Calendar,
    MessageSquare,
    User,
    Package,
    MapPin,
    Clapperboard,
    Film,
    AlertCircle,
} from 'lucide-react';
import type { Task } from '../../types/types';
import { PRIORITY_CONFIG, getCategoryBadgeStyle } from './taskConstants';

interface TaskCardProps {
    task: Task;
    onClick: (task: Task) => void;
    isOverlay?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onClick, isOverlay = false }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: task.id,
        data: { task },
        disabled: isOverlay,
    });

    const style = transform
        ? {
              transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
          }
        : undefined;

    const priorityInfo = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
    const categoryBadgeClass = getCategoryBadgeStyle(task.category || 'General');

    // Due date overdue check
    const isOverdue = task.dueDate && task.status !== 'done' && new Date(task.dueDate) < new Date(new Date().setHours(0, 0, 0, 0));

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            onClick={() => onClick(task)}
            className={`group relative rounded-xl border p-3.5 bg-white dark:bg-primary-900 transition-all select-none cursor-grab active:cursor-grabbing text-left ${
                isDragging
                    ? 'opacity-30 border-dashed border-primary-400'
                    : 'border-primary-200 dark:border-primary-800 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-md'
            } ${isOverlay ? 'shadow-2xl ring-2 ring-secondary-500 scale-105 z-50 cursor-grabbing' : ''}`}
        >
            {/* Top row: Priority & Category */}
            <div className="flex items-center justify-between gap-2 mb-2">
                <span
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold border ${categoryBadgeClass} truncate max-w-[140px]`}
                >
                    {task.category || 'General'}
                </span>

                <span
                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border ${priorityInfo.badgeClass}`}
                >
                    <span className={`w-1.5 h-1.5 rounded-full ${priorityInfo.dotClass}`} />
                    {priorityInfo.label}
                </span>
            </div>

            {/* Task Name */}
            <h4
                className={`text-sm font-bold text-primary-900 dark:text-white leading-snug mb-1.5 ${
                    task.status === 'done' ? 'line-through text-primary-400 dark:text-primary-500' : ''
                }`}
            >
                {task.name}
            </h4>

            {/* Description Snippet */}
            {task.description && (
                <p className="text-xs text-primary-500 dark:text-primary-400 line-clamp-2 mb-3 leading-relaxed">
                    {task.description}
                </p>
            )}

            {/* Related Entity Chips */}
            {(task.relatedSceneName || task.relatedAssetName || task.relatedLocationName || task.relatedShotName) && (
                <div className="flex flex-wrap gap-1 mb-3">
                    {task.relatedSceneName && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-primary-100 dark:bg-primary-800 text-primary-700 dark:text-primary-300">
                            <Clapperboard size={10} />
                            <span className="truncate max-w-[100px]">{task.relatedSceneName}</span>
                        </span>
                    )}
                    {task.relatedShotName && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-primary-100 dark:bg-primary-800 text-primary-700 dark:text-primary-300">
                            <Film size={10} />
                            <span className="truncate max-w-[100px]">{task.relatedShotName}</span>
                        </span>
                    )}
                    {task.relatedAssetName && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-primary-100 dark:bg-primary-800 text-primary-700 dark:text-primary-300">
                            <Package size={10} />
                            <span className="truncate max-w-[100px]">{task.relatedAssetName}</span>
                        </span>
                    )}
                    {task.relatedLocationName && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-primary-100 dark:bg-primary-800 text-primary-700 dark:text-primary-300">
                            <MapPin size={10} />
                            <span className="truncate max-w-[100px]">{task.relatedLocationName}</span>
                        </span>
                    )}
                </div>
            )}

            {/* Bottom Meta: Due Date, Assignee, Comments count */}
            <div className="flex items-center justify-between pt-2 border-t border-primary-100 dark:border-primary-800/60 text-xs text-primary-500 dark:text-primary-400">
                <div className="flex items-center gap-2 min-w-0">
                    {task.dueDate ? (
                        <span
                            className={`flex items-center gap-1 text-[11px] font-medium ${
                                isOverdue
                                    ? 'text-danger-600 dark:text-danger-400 font-bold'
                                    : 'text-primary-500 dark:text-primary-400'
                            }`}
                            title={isOverdue ? 'Overdue!' : `Due ${task.dueDate}`}
                        >
                            {isOverdue ? <AlertCircle size={12} /> : <Calendar size={12} />}
                            {task.dueDate}
                        </span>
                    ) : (
                        <span />
                    )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    {task.comments && task.comments.length > 0 && (
                        <span
                            className="flex items-center gap-1 text-[11px] font-medium text-primary-400 hover:text-primary-600 dark:hover:text-primary-200"
                            title={`${task.comments.length} comments`}
                        >
                            <MessageSquare size={12} />
                            {task.comments.length}
                        </span>
                    )}

                    {task.responsiblePersonName ? (
                        <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary-50 dark:bg-secondary-950/50 text-secondary-700 dark:text-secondary-300 font-semibold text-[11px]"
                            title={`Assigned to ${task.responsiblePersonName}`}
                        >
                            <User size={11} />
                            <span className="truncate max-w-[90px]">{task.responsiblePersonName}</span>
                        </span>
                    ) : (
                        <span className="text-[10px] text-primary-300 dark:text-primary-600 italic">
                            Unassigned
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};
