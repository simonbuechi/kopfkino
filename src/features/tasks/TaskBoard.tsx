import React, { useState, useMemo } from 'react';
import {
    DndContext,
    DragOverlay,
    useDroppable,
    PointerSensor,
    KeyboardSensor,
    useSensors,
    useSensor,
    type DragStartEvent,
    type DragEndEvent,
} from '@dnd-kit/core';
import {
    Plus,
    Search,
    Filter,
    ChevronDown,
    ChevronRight,
    SlidersHorizontal,
    X,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useStore } from '../../hooks/useStore';
import type { Task, TaskStatus, TaskPriority } from '../../types/types';
import { TaskCard } from './TaskCard';
import {
    DEFAULT_CATEGORIES,
    STATUS_CONFIG,
    PRIORITY_CONFIG,
    getCategoryBadgeStyle,
    type GroupByField,
    type SwimlaneField,
} from './taskConstants';

interface TaskBoardProps {
    tasks: Task[];
    onTaskClick: (task: Task) => void;
    onAddTask: (defaults?: { category?: string; status?: TaskStatus }) => void;
    onUpdateTask: (task: Task) => void;
}

interface ColumnDef {
    id: string;
    label: string;
    badgeClass?: string;
    dotClass?: string;
}

interface SwimlaneDef {
    id: string;
    label: string;
    badgeClass?: string;
}

// Droppable Cell Component
const KanbanCell: React.FC<{
    cellId: string;
    tasks: Task[];
    onTaskClick: (task: Task) => void;
    onAddTask: () => void;
}> = ({ cellId, tasks, onTaskClick, onAddTask }) => {
    const { setNodeRef, isOver } = useDroppable({
        id: cellId,
    });

    return (
        <div
            ref={setNodeRef}
            className={`min-h-[110px] p-2.5 rounded-xl transition-colors flex flex-col gap-2.5 border ${
                isOver
                    ? 'bg-secondary-50/70 dark:bg-secondary-950/30 border-secondary-400 ring-2 ring-secondary-400/40'
                    : 'bg-primary-50/40 dark:bg-black/20 border-primary-100 dark:border-primary-800/40 hover:bg-primary-50/70 dark:hover:bg-black/30'
            }`}
        >
            {tasks.map(task => (
                <TaskCard key={task.id} task={task} onClick={onTaskClick} />
            ))}

            {tasks.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center p-3 text-center border border-dashed border-primary-200 dark:border-primary-800 rounded-lg group">
                    <span className="text-[11px] text-primary-400 select-none">Empty</span>
                    <button
                        type="button"
                        onClick={onAddTask}
                        className="opacity-0 group-hover:opacity-100 transition-opacity mt-1 text-[11px] font-semibold text-secondary-600 dark:text-secondary-400 hover:underline flex items-center gap-0.5"
                    >
                        <Plus size={12} /> Add
                    </button>
                </div>
            )}
        </div>
    );
};

export const TaskBoard: React.FC<TaskBoardProps> = ({
    tasks,
    onTaskClick,
    onAddTask,
    onUpdateTask,
}) => {
    const { people } = useStore();

    // Grouping settings
    const [columnField, setColumnField] = useState<GroupByField>('status');
    const [swimlaneField, setSwimlaneField] = useState<SwimlaneField>('category');

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [filterPriority, setFilterPriority] = useState<string>('all');
    const [filterAssignee, setFilterAssignee] = useState<string>('all');
    const [showFilters, setShowFilters] = useState(false);

    // Collapsed swimlanes set
    const [collapsedRows, setCollapsedRows] = useState<Set<string>>(new Set());

    // Drag state
    const [activeDragTask, setActiveDragTask] = useState<Task | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor)
    );

    const toggleRow = (id: string) => {
        setCollapsedRows(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    // Filtered tasks list
    const filteredTasks = useMemo(() => {
        return tasks.filter(t => {
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matchName = t.name.toLowerCase().includes(q);
                const matchDesc = t.description?.toLowerCase().includes(q);
                if (!matchName && !matchDesc) return false;
            }
            if (filterCategory !== 'all' && t.category !== filterCategory) return false;
            if (filterStatus !== 'all' && t.status !== filterStatus) return false;
            if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
            if (filterAssignee !== 'all') {
                if (filterAssignee === 'unassigned' && t.responsiblePersonId) return false;
                if (filterAssignee !== 'unassigned' && t.responsiblePersonId !== filterAssignee) return false;
            }
            return true;
        });
    }, [tasks, searchQuery, filterCategory, filterStatus, filterPriority, filterAssignee]);

    // Active filters count
    const hasActiveFilters = searchQuery.trim() !== '' || filterCategory !== 'all' || filterStatus !== 'all' || filterPriority !== 'all' || filterAssignee !== 'all';

    const clearAllFilters = () => {
        setSearchQuery('');
        setFilterCategory('all');
        setFilterStatus('all');
        setFilterPriority('all');
        setFilterAssignee('all');
    };

    // All distinct categories
    const allCategories = useMemo(() => {
        const set = new Set<string>(DEFAULT_CATEGORIES);
        tasks.forEach(t => {
            if (t.category) set.add(t.category);
        });
        return Array.from(set);
    }, [tasks]);

    // Generate Column definitions based on columnField
    const columns: ColumnDef[] = useMemo(() => {
        if (columnField === 'status') {
            return (['backlog', 'todo', 'in_progress', 'done'] as TaskStatus[]).map(st => ({
                id: st,
                label: STATUS_CONFIG[st].label,
                badgeClass: `${STATUS_CONFIG[st].bg} ${STATUS_CONFIG[st].text} ${STATUS_CONFIG[st].border}`,
            }));
        }
        if (columnField === 'priority') {
            return (['high', 'medium', 'low'] as TaskPriority[]).map(pr => ({
                id: pr,
                label: PRIORITY_CONFIG[pr].label,
                badgeClass: PRIORITY_CONFIG[pr].badgeClass,
                dotClass: PRIORITY_CONFIG[pr].dotClass,
            }));
        }
        if (columnField === 'category') {
            return allCategories.map(cat => ({
                id: cat,
                label: cat,
                badgeClass: getCategoryBadgeStyle(cat),
            }));
        }
        if (columnField === 'assignee') {
            const list: ColumnDef[] = people.map(p => ({
                id: p.id,
                label: p.name,
            }));
            list.push({ id: '__unassigned__', label: 'Unassigned' });
            return list;
        }
        return [];
    }, [columnField, allCategories, people]);

    // Generate Swimlane (Row) definitions based on swimlaneField
    const swimlanes: SwimlaneDef[] = useMemo(() => {
        if (swimlaneField === 'none') {
            return [{ id: '__all__', label: 'All Tasks' }];
        }
        if (swimlaneField === 'category') {
            return allCategories.map(cat => ({
                id: cat,
                label: cat,
                badgeClass: getCategoryBadgeStyle(cat),
            }));
        }
        if (swimlaneField === 'status') {
            return (['backlog', 'todo', 'in_progress', 'done'] as TaskStatus[]).map(st => ({
                id: st,
                label: STATUS_CONFIG[st].label,
                badgeClass: `${STATUS_CONFIG[st].bg} ${STATUS_CONFIG[st].text} ${STATUS_CONFIG[st].border}`,
            }));
        }
        if (swimlaneField === 'priority') {
            return (['high', 'medium', 'low'] as TaskPriority[]).map(pr => ({
                id: pr,
                label: PRIORITY_CONFIG[pr].label,
                badgeClass: PRIORITY_CONFIG[pr].badgeClass,
            }));
        }
        if (swimlaneField === 'assignee') {
            const list: SwimlaneDef[] = people.map(p => ({
                id: p.id,
                label: p.name,
            }));
            list.push({ id: '__unassigned__', label: 'Unassigned' });
            return list;
        }
        return [{ id: '__all__', label: 'Tasks' }];
    }, [swimlaneField, allCategories, people]);

    // Fast lookup for cells: map `${colId}:::${rowId}` -> Task[]
    const tasksByCell = useMemo(() => {
        const map = new Map<string, Task[]>();

        const getColKey = (t: Task): string => {
            if (columnField === 'status') return t.status;
            if (columnField === 'priority') return t.priority;
            if (columnField === 'category') return t.category || 'General';
            if (columnField === 'assignee') return t.responsiblePersonId || '__unassigned__';
            return 'all';
        };

        const getRowKey = (t: Task): string => {
            if (swimlaneField === 'none') return '__all__';
            if (swimlaneField === 'category') return t.category || 'General';
            if (swimlaneField === 'status') return t.status;
            if (swimlaneField === 'priority') return t.priority;
            if (swimlaneField === 'assignee') return t.responsiblePersonId || '__unassigned__';
            return '__all__';
        };

        filteredTasks.forEach(task => {
            const cKey = getColKey(task);
            const rKey = getRowKey(task);
            const cellId = `${cKey}:::${rKey}`;
            const list = map.get(cellId) || [];
            list.push(task);
            map.set(cellId, list);
        });

        return map;
    }, [filteredTasks, columnField, swimlaneField]);

    // DnD handlers
    const handleDragStart = (e: DragStartEvent) => {
        const task = e.active.data.current?.task as Task;
        setActiveDragTask(task || null);
    };

    const handleDragEnd = (e: DragEndEvent) => {
        const { active, over } = e;
        setActiveDragTask(null);

        if (!over) return;

        const cellId = String(over.id);
        const [targetColId, targetRowId] = cellId.split(':::');
        if (!targetColId || !targetRowId) return;

        const task = active.data.current?.task as Task;
        if (!task) return;

        let changed = false;
        const updated: Task = { ...task };

        // Update column attribute
        if (columnField === 'status' && updated.status !== targetColId) {
            updated.status = targetColId as TaskStatus;
            changed = true;
        } else if (columnField === 'priority' && updated.priority !== targetColId) {
            updated.priority = targetColId as TaskPriority;
            changed = true;
        } else if (columnField === 'category' && updated.category !== targetColId) {
            updated.category = targetColId;
            changed = true;
        } else if (columnField === 'assignee') {
            const newPersonId = targetColId === '__unassigned__' ? undefined : targetColId;
            if (updated.responsiblePersonId !== newPersonId) {
                updated.responsiblePersonId = newPersonId;
                const p = people.find(item => item.id === newPersonId);
                updated.responsiblePersonName = p?.name;
                changed = true;
            }
        }

        // Update swimlane attribute (if not none)
        if (swimlaneField === 'category' && updated.category !== targetRowId) {
            updated.category = targetRowId;
            changed = true;
        } else if (swimlaneField === 'status' && updated.status !== targetRowId) {
            updated.status = targetRowId as TaskStatus;
            changed = true;
        } else if (swimlaneField === 'priority' && updated.priority !== targetRowId) {
            updated.priority = targetRowId as TaskPriority;
            changed = true;
        } else if (swimlaneField === 'assignee') {
            const newPersonId = targetRowId === '__unassigned__' ? undefined : targetRowId;
            if (updated.responsiblePersonId !== newPersonId) {
                updated.responsiblePersonId = newPersonId;
                const p = people.find(item => item.id === newPersonId);
                updated.responsiblePersonName = p?.name;
                changed = true;
            }
        }

        if (changed) {
            onUpdateTask(updated);
        }
    };

    return (
        <div className="flex flex-col gap-4">
            {/* Top Toolbar: Search, Group By Controls, Filter Toggles */}
            <div className="p-4 bg-white dark:bg-primary-900 border border-primary-200 dark:border-primary-800 rounded-2xl shadow-xs flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
                    {/* Search Input */}
                    <div className="relative flex-1 min-w-[200px] max-w-md">
                        <Search
                            size={16}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-400"
                        />
                        <input
                            type="text"
                            placeholder="Search tasks by name or description..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-3 py-1.5 bg-primary-50 dark:bg-black/40 border border-primary-200 dark:border-primary-800 rounded-xl text-xs text-primary-900 dark:text-white placeholder:text-primary-400 focus:outline-none focus:ring-2 focus:ring-secondary-500"
                        />
                    </div>

                    {/* Filter Toggle Button */}
                    <Button
                        variant={showFilters || hasActiveFilters ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setShowFilters(!showFilters)}
                        className="text-xs h-8 flex items-center gap-1.5"
                    >
                        <Filter size={13} />
                        Filters
                        {hasActiveFilters && (
                            <span className="w-2 h-2 rounded-full bg-secondary-500 inline-block" />
                        )}
                    </Button>

                    {hasActiveFilters && (
                        <button
                            type="button"
                            onClick={clearAllFilters}
                            className="text-xs text-primary-400 hover:text-primary-600 dark:hover:text-primary-200 flex items-center gap-1"
                        >
                            <X size={12} /> Clear
                        </button>
                    )}
                </div>

                {/* Group By Switchers */}
                <div className="flex items-center gap-3 text-xs">
                    <div className="flex items-center gap-1.5">
                        <SlidersHorizontal size={13} className="text-primary-400" />
                        <span className="font-semibold text-primary-500 dark:text-primary-400">
                            Columns:
                        </span>
                        <select
                            value={columnField}
                            onChange={(e) => setColumnField(e.target.value as GroupByField)}
                            className="px-2 py-1 bg-primary-50 dark:bg-black/40 border border-primary-200 dark:border-primary-800 rounded-lg text-xs font-semibold text-primary-800 dark:text-primary-200"
                        >
                            <option value="status">Status</option>
                            <option value="priority">Priority</option>
                            <option value="category">Category</option>
                            <option value="assignee">Assignee</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-primary-500 dark:text-primary-400">
                            Rows:
                        </span>
                        <select
                            value={swimlaneField}
                            onChange={(e) => setSwimlaneField(e.target.value as SwimlaneField)}
                            className="px-2 py-1 bg-primary-50 dark:bg-black/40 border border-primary-200 dark:border-primary-800 rounded-lg text-xs font-semibold text-primary-800 dark:text-primary-200"
                        >
                            <option value="category">Category</option>
                            <option value="priority">Priority</option>
                            <option value="status">Status</option>
                            <option value="assignee">Assignee</option>
                            <option value="none">None (Flat)</option>
                        </select>
                    </div>

                    <Button
                        size="sm"
                        onClick={() => onAddTask()}
                        className="text-xs h-8 flex items-center gap-1 ml-1"
                    >
                        <Plus size={14} /> Add Task
                    </Button>
                </div>
            </div>

            {/* Expandable Filter Bar */}
            {showFilters && (
                <div className="p-3 bg-primary-50 dark:bg-primary-950/40 border border-primary-200 dark:border-primary-800 rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-3 animate-in fade-in duration-150 text-xs">
                    <div>
                        <label className="block text-[11px] font-semibold text-primary-500 mb-1">
                            Status
                        </label>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="w-full px-2.5 py-1 bg-white dark:bg-primary-900 border border-primary-200 dark:border-primary-800 rounded-lg text-xs"
                        >
                            <option value="all">All Statuses</option>
                            <option value="backlog">Backlog</option>
                            <option value="todo">To Do</option>
                            <option value="in_progress">In Progress</option>
                            <option value="done">Done</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-[11px] font-semibold text-primary-500 mb-1">
                            Category
                        </label>
                        <select
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                            className="w-full px-2.5 py-1 bg-white dark:bg-primary-900 border border-primary-200 dark:border-primary-800 rounded-lg text-xs"
                        >
                            <option value="all">All Categories</option>
                            {allCategories.map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-[11px] font-semibold text-primary-500 mb-1">
                            Priority
                        </label>
                        <select
                            value={filterPriority}
                            onChange={(e) => setFilterPriority(e.target.value)}
                            className="w-full px-2.5 py-1 bg-white dark:bg-primary-900 border border-primary-200 dark:border-primary-800 rounded-lg text-xs"
                        >
                            <option value="all">All Priorities</option>
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-[11px] font-semibold text-primary-500 mb-1">
                            Assignee
                        </label>
                        <select
                            value={filterAssignee}
                            onChange={(e) => setFilterAssignee(e.target.value)}
                            className="w-full px-2.5 py-1 bg-white dark:bg-primary-900 border border-primary-200 dark:border-primary-800 rounded-lg text-xs"
                        >
                            <option value="all">All People</option>
                            <option value="unassigned">Unassigned</option>
                            {people.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            )}

            {/* Kanban Matrix Board */}
            <DndContext
                sensors={sensors}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div className="bg-white dark:bg-primary-900 border border-primary-200 dark:border-primary-800 rounded-2xl shadow-xs overflow-x-auto">
                    <div className="min-w-[900px] flex flex-col divide-y divide-primary-100 dark:divide-primary-800/60">
                        {/* Column Headers Row */}
                        <div className="grid grid-cols-4 p-3 bg-primary-50/70 dark:bg-black/40 gap-3 border-b border-primary-200 dark:border-primary-800 select-none">
                            {columns.map(col => {
                                const totalInCol = filteredTasks.filter(t => {
                                    if (columnField === 'status') return t.status === col.id;
                                    if (columnField === 'priority') return t.priority === col.id;
                                    if (columnField === 'category') return t.category === col.id;
                                    if (columnField === 'assignee') return (t.responsiblePersonId || '__unassigned__') === col.id;
                                    return true;
                                }).length;

                                return (
                                    <div
                                        key={col.id}
                                        className="flex items-center justify-between px-2"
                                    >
                                        <div className="flex items-center gap-2">
                                            {col.dotClass && (
                                                <span className={`w-2 h-2 rounded-full ${col.dotClass}`} />
                                            )}
                                            <span className="font-bold text-xs uppercase tracking-wider text-primary-700 dark:text-primary-300 truncate">
                                                {col.label}
                                            </span>
                                        </div>
                                        <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-primary-200/60 dark:bg-primary-800 text-primary-600 dark:text-primary-400">
                                            {totalInCol}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Swimlanes (Rows) */}
                        <div className="divide-y divide-primary-100 dark:divide-primary-800/50">
                            {swimlanes.map(row => {
                                const isCollapsed = collapsedRows.has(row.id);

                                // Total tasks in this swimlane
                                const tasksInSwimlane = filteredTasks.filter(t => {
                                    if (swimlaneField === 'none') return true;
                                    if (swimlaneField === 'category') return t.category === row.id;
                                    if (swimlaneField === 'status') return t.status === row.id;
                                    if (swimlaneField === 'priority') return t.priority === row.id;
                                    if (swimlaneField === 'assignee') return (t.responsiblePersonId || '__unassigned__') === row.id;
                                    return true;
                                });

                                return (
                                    <div key={row.id} className="flex flex-col">
                                        {/* Swimlane Header Banner (if not 'none') */}
                                        {swimlaneField !== 'none' && (
                                            <div
                                                onClick={() => toggleRow(row.id)}
                                                className="px-4 py-2.5 bg-primary-100/50 dark:bg-primary-800/30 hover:bg-primary-100 dark:hover:bg-primary-800/60 transition-colors flex items-center justify-between cursor-pointer select-none"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <button type="button" className="text-primary-500 p-0.5">
                                                        {isCollapsed ? <ChevronRight size={15} /> : <ChevronDown size={15} />}
                                                    </button>
                                                    <span className="font-bold text-xs text-primary-900 dark:text-white">
                                                        {row.label}
                                                    </span>
                                                    <span className="text-[11px] text-primary-400">
                                                        ({tasksInSwimlane.length})
                                                    </span>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onAddTask({
                                                            category: swimlaneField === 'category' ? row.id : undefined,
                                                            status: swimlaneField === 'status' ? (row.id as TaskStatus) : undefined,
                                                        });
                                                    }}
                                                    className="text-xs text-secondary-600 dark:text-secondary-400 hover:underline flex items-center gap-1 font-semibold"
                                                >
                                                    <Plus size={13} /> Add in {row.label}
                                                </button>
                                            </div>
                                        )}

                                        {/* Swimlane Cells Grid */}
                                        {!isCollapsed && (
                                            <div className="grid grid-cols-4 gap-3 p-3 bg-white dark:bg-primary-900">
                                                {columns.map(col => {
                                                    const cellId = `${col.id}:::${row.id}`;
                                                    const cellTasks = tasksByCell.get(cellId) || [];

                                                    return (
                                                        <KanbanCell
                                                            key={cellId}
                                                            cellId={cellId}
                                                            tasks={cellTasks}
                                                            onTaskClick={onTaskClick}
                                                            onAddTask={() =>
                                                                onAddTask({
                                                                    category:
                                                                        columnField === 'category'
                                                                            ? col.id
                                                                            : swimlaneField === 'category'
                                                                            ? row.id
                                                                            : undefined,
                                                                    status:
                                                                        columnField === 'status'
                                                                            ? (col.id as TaskStatus)
                                                                            : swimlaneField === 'status'
                                                                            ? (row.id as TaskStatus)
                                                                            : undefined,
                                                                })
                                                            }
                                                        />
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Floating Drag Overlay Card */}
                <DragOverlay>
                    {activeDragTask ? (
                        <div className="w-64 rotate-2">
                            <TaskCard task={activeDragTask} onClick={() => {}} isOverlay />
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>
        </div>
    );
};
