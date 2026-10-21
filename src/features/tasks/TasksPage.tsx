import React, { useState } from 'react';
import { Plus, CheckSquare, Sparkles } from 'lucide-react';
import { useStore } from '../../hooks/useStore';
import { useProjects } from '../../hooks/useProjects';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { TaskBoard } from './TaskBoard';
import { TaskModal } from './TaskModal';
import type { Task, TaskStatus } from '../../types/types';

export const TasksPage: React.FC = () => {
    const { tasks, saveTask, saveTasks, deleteTask } = useStore();
    const { activeProjectId } = useProjects();
    const { confirm, confirmDialog } = useConfirmDialog();

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [defaultCategory, setDefaultCategory] = useState<string | undefined>(undefined);
    const [defaultStatus, setDefaultStatus] = useState<TaskStatus | undefined>(undefined);

    const handleOpenAddTask = (defaults?: { category?: string; status?: TaskStatus }) => {
        setEditingTask(null);
        setDefaultCategory(defaults?.category);
        setDefaultStatus(defaults?.status || 'todo');
        setIsModalOpen(true);
    };

    const handleOpenEditTask = (task: Task) => {
        setEditingTask(task);
        setDefaultCategory(task.category);
        setDefaultStatus(task.status);
        setIsModalOpen(true);
    };

    const handleSaveTask = async (data: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'projectId'>) => {
        if (!activeProjectId) return;

        if (editingTask) {
            const updated: Task = {
                ...editingTask,
                ...data,
                updatedAt: Date.now(),
            };
            await saveTask(updated);
        } else {
            const newTask: Task = {
                id: crypto.randomUUID(),
                projectId: activeProjectId,
                ...data,
                order: tasks.length,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            };
            await saveTask(newTask);
        }
    };

    const handleDeleteTask = async (taskId: string) => {
        const taskToDelete = tasks.find(t => t.id === taskId);
        if (
            await confirm(`Delete task "${taskToDelete?.name}"? This cannot be undone.`, {
                title: 'Delete Task',
                confirmLabel: 'Delete',
            })
        ) {
            await deleteTask(taskId);
            setIsModalOpen(false);
        }
    };

    // Quick populate starter film production tasks
    const handleAddStarterTasks = async () => {
        if (!activeProjectId) return;
        const starter: Task[] = [
            {
                id: crypto.randomUUID(),
                projectId: activeProjectId,
                name: 'Finalize shot list & camera angles',
                description: 'Review script breakdown with cinematographer and director.',
                category: 'Camera',
                status: 'todo',
                priority: 'high',
                comments: [],
                order: 0,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            },
            {
                id: crypto.randomUUID(),
                projectId: activeProjectId,
                name: 'Scout exterior location & permits',
                description: 'Verify noise levels, power outlets, and daylight angles.',
                category: 'Pre-Production',
                status: 'in_progress',
                priority: 'high',
                comments: [],
                order: 1,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            },
            {
                id: crypto.randomUUID(),
                projectId: activeProjectId,
                name: 'Wardrobe fitting & character style guide',
                description: 'Fit lead characters and confirm doubles.',
                category: 'Wardrobe & Makeup',
                status: 'todo',
                priority: 'medium',
                comments: [],
                order: 2,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            },
            {
                id: crypto.randomUUID(),
                projectId: activeProjectId,
                name: 'Lighting package and generator check',
                description: 'Inspect HMIs, LED panels, and spare cables.',
                category: 'Lighting',
                status: 'backlog',
                priority: 'medium',
                comments: [],
                order: 3,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            },
        ];

        await saveTasks(starter);
    };

    const existingCategories = Array.from(new Set(tasks.map(t => t.category).filter(Boolean)));

    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-300">
            <PageHeader
                title="Tasks"
                actions={
                    <Button onClick={() => handleOpenAddTask()} className="flex items-center gap-1.5">
                        <Plus size={18} /> Add Task
                    </Button>
                }
            />

            {tasks.length === 0 ? (
                <EmptyState
                    icon={<CheckSquare size={48} />}
                    message="No tasks yet"
                    description="Organize your team's workflow with a 2D Scrum & Kanban board. Track status, assignees, priorities, and project resources."
                    action={
                        <div className="flex flex-wrap items-center justify-center gap-3">
                            <Button onClick={() => handleOpenAddTask()} className="flex items-center gap-1.5">
                                <Plus size={18} /> Add Task
                            </Button>
                            <Button variant="secondary" onClick={handleAddStarterTasks} className="flex items-center gap-1.5">
                                <Sparkles size={16} /> Load Film Starter Tasks
                            </Button>
                        </div>
                    }
                />
            ) : (
                <TaskBoard
                    tasks={tasks}
                    onTaskClick={handleOpenEditTask}
                    onAddTask={handleOpenAddTask}
                    onUpdateTask={saveTask}
                />
            )}

            <TaskModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveTask}
                onDelete={handleDeleteTask}
                initialTask={editingTask}
                defaultCategory={defaultCategory}
                defaultStatus={defaultStatus}
                existingCategories={existingCategories}
            />

            {confirmDialog}
        </div>
    );
};

export default TasksPage;
