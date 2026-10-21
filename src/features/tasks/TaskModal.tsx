import React, { useState } from 'react';
import {
    CheckSquare,
    Trash2,
    User,
    Package,
    MapPin,
    Clapperboard,
    Film,
    MessageSquare,
    Send,
    Tag,
} from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input, TextArea } from '../../components/ui/Input';
import { useStore } from '../../hooks/useStore';
import { useAuth } from '../../hooks/useAuth';
import type { Task, TaskStatus, TaskPriority, TaskComment } from '../../types/types';
import { DEFAULT_CATEGORIES, STATUS_CONFIG, PRIORITY_CONFIG } from './taskConstants';

interface TaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: {
        name: string;
        description?: string;
        category: string;
        status: TaskStatus;
        priority: TaskPriority;
        responsiblePersonId?: string;
        responsiblePersonName?: string;
        dueDate?: string;
        relatedAssetId?: string;
        relatedAssetName?: string;
        relatedLocationId?: string;
        relatedLocationName?: string;
        relatedSceneId?: string;
        relatedSceneName?: string;
        relatedShotId?: string;
        relatedShotName?: string;
        comments: TaskComment[];
    }) => void;
    onDelete?: (taskId: string) => void;
    initialTask?: Task | null;
    defaultCategory?: string;
    defaultStatus?: TaskStatus;
    existingCategories: string[];
}

const TaskForm: React.FC<{
    initialTask?: Task | null;
    defaultCategory?: string;
    defaultStatus?: TaskStatus;
    existingCategories: string[];
    onClose: () => void;
    onSave: TaskModalProps['onSave'];
    onDelete?: (taskId: string) => void;
}> = ({
    initialTask,
    defaultCategory,
    defaultStatus,
    existingCategories,
    onClose,
    onSave,
    onDelete,
}) => {
    const { user } = useAuth();
    const { people, assets, locations, scenes } = useStore();

    // Field states
    const [name, setName] = useState(initialTask?.name || '');
    const [description, setDescription] = useState(initialTask?.description || '');
    const [category, setCategory] = useState(
        initialTask?.category || defaultCategory || existingCategories[0] || 'General'
    );
    const [status, setStatus] = useState<TaskStatus>(
        initialTask?.status || defaultStatus || 'todo'
    );
    const [priority, setPriority] = useState<TaskPriority>(
        initialTask?.priority || 'medium'
    );
    const [responsiblePersonId, setResponsiblePersonId] = useState(
        initialTask?.responsiblePersonId || ''
    );
    const [dueDate, setDueDate] = useState(initialTask?.dueDate || '');

    // Related entities
    const [relatedAssetId, setRelatedAssetId] = useState(
        initialTask?.relatedAssetId || ''
    );
    const [relatedLocationId, setRelatedLocationId] = useState(
        initialTask?.relatedLocationId || ''
    );
    const [relatedSceneId, setRelatedSceneId] = useState(
        initialTask?.relatedSceneId || ''
    );
    const [relatedShotId, setRelatedShotId] = useState(
        initialTask?.relatedShotId || ''
    );

    // Comments
    const [comments, setComments] = useState<TaskComment[]>(
        initialTask?.comments || []
    );
    const [newCommentText, setNewCommentText] = useState('');

    // Compile shots list
    const allShots = scenes.flatMap(s =>
        (s.shots || []).map(sh => ({
            ...sh,
            sceneId: s.id,
            sceneNumber: s.number,
            label: `Scene ${s.number}: Shot ${sh.number || ''} — ${sh.name || 'Untitled'}`,
        }))
    );

    // Filter shots if a scene is selected
    const availableShots = relatedSceneId
        ? allShots.filter(sh => sh.sceneId === relatedSceneId)
        : allShots;

    // Available categories list
    const allCategories = Array.from(
        new Set([...DEFAULT_CATEGORIES, ...existingCategories, category].filter(Boolean))
    );

    const handleAddComment = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCommentText.trim()) return;

        const newComment: TaskComment = {
            id: crypto.randomUUID(),
            authorId: user?.uid || 'anon',
            authorName: user?.displayName || user?.email || 'Team Member',
            text: newCommentText.trim(),
            createdAt: Date.now(),
        };

        setComments(prev => [...prev, newComment]);
        setNewCommentText('');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        // Resolve names
        const person = people.find(p => p.id === responsiblePersonId);
        const asset = assets.find(a => a.id === relatedAssetId);
        const loc = locations.find(l => l.id === relatedLocationId);
        const sc = scenes.find(s => s.id === relatedSceneId);
        const sh = allShots.find(s => s.id === relatedShotId);

        onSave({
            name: name.trim(),
            description: description.trim() || undefined,
            category: category.trim() || 'General',
            status,
            priority,
            responsiblePersonId: responsiblePersonId || undefined,
            responsiblePersonName: person?.name || undefined,
            dueDate: dueDate || undefined,
            relatedAssetId: relatedAssetId || undefined,
            relatedAssetName: asset?.name || undefined,
            relatedLocationId: relatedLocationId || undefined,
            relatedLocationName: loc?.name || undefined,
            relatedSceneId: relatedSceneId || undefined,
            relatedSceneName: sc ? `Scene ${sc.number}` : undefined,
            relatedShotId: relatedShotId || undefined,
            relatedShotName: sh ? `Shot ${sh.number || ''}` : undefined,
            comments,
        });

        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="mt-4 space-y-5">
            {/* Title */}
            <Input
                label="Task Name"
                required
                placeholder="e.g. Rig camera on dolly, Check wardrobe sizes for lead"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
            />

            {/* Description */}
            <TextArea
                label="Description"
                placeholder="Add context, specifications, or checklist items..."
                rows={3}
                value={description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
            />

            {/* Status & Priority */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-semibold text-primary-900 dark:text-primary-100 mb-1">
                        Status
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        {(['backlog', 'todo', 'in_progress', 'done'] as TaskStatus[]).map(st => {
                            const config = STATUS_CONFIG[st];
                            const isSelected = status === st;
                            return (
                                <button
                                    key={st}
                                    type="button"
                                    onClick={() => setStatus(st)}
                                    className={`px-3 py-2 text-xs font-bold rounded-xl border text-center transition-all ${
                                        isSelected
                                            ? `${config.bg} ${config.text} ${config.border} ring-2 ring-primary-900 dark:ring-white scale-102`
                                            : 'border-primary-200 dark:border-primary-800 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-800'
                                    }`}
                                >
                                    {config.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-primary-900 dark:text-primary-100 mb-1">
                        Priority
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                        {(['low', 'medium', 'high'] as TaskPriority[]).map(pr => {
                            const config = PRIORITY_CONFIG[pr];
                            const isSelected = priority === pr;
                            return (
                                <button
                                    key={pr}
                                    type="button"
                                    onClick={() => setPriority(pr)}
                                    className={`px-3 py-2 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
                                        isSelected
                                            ? `${config.badgeClass} ring-2 ring-primary-900 dark:ring-white scale-102`
                                            : 'border-primary-200 dark:border-primary-800 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-800'
                                    }`}
                                >
                                    <span className={`w-2 h-2 rounded-full ${config.dotClass}`} />
                                    {config.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Category & Assignee & Due Date */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                    <label className="block text-sm font-semibold text-primary-900 dark:text-primary-100 mb-1 flex items-center gap-1">
                        <Tag size={14} /> Category
                    </label>
                    <input
                        list="categories-list"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        placeholder="e.g. Camera, Sound"
                        className="w-full px-3 py-2 bg-white dark:bg-primary-900 border border-primary-200 dark:border-primary-800 rounded-lg text-primary-900 dark:text-white text-sm"
                        required
                    />
                    <datalist id="categories-list">
                        {allCategories.map(c => (
                            <option key={c} value={c} />
                        ))}
                    </datalist>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-primary-900 dark:text-primary-100 mb-1 flex items-center gap-1">
                        <User size={14} /> Responsible Person
                    </label>
                    <select
                        value={responsiblePersonId}
                        onChange={(e) => setResponsiblePersonId(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-primary-900 border border-primary-200 dark:border-primary-800 rounded-lg text-primary-900 dark:text-white text-sm"
                    >
                        <option value="">-- Unassigned --</option>
                        {people.map(p => (
                            <option key={p.id} value={p.id}>
                                {p.name} {p.role ? `(${p.role})` : ''}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <Input
                        type="date"
                        label="Due Date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                    />
                </div>
            </div>

            {/* Related Project Resources Section */}
            <div className="p-4 bg-primary-50/70 dark:bg-primary-950/40 rounded-xl border border-primary-200 dark:border-primary-800 space-y-3">
                <span className="block text-xs font-bold uppercase tracking-wider text-primary-500 dark:text-primary-400">
                    Related Project Resources
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Related Scene */}
                    <div>
                        <label className="block text-xs font-semibold text-primary-700 dark:text-primary-300 mb-1 flex items-center gap-1">
                            <Clapperboard size={12} /> Related Scene
                        </label>
                        <select
                            value={relatedSceneId}
                            onChange={(e) => {
                                setRelatedSceneId(e.target.value);
                                setRelatedShotId(''); // reset shot if scene changes
                            }}
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-primary-900 border border-primary-200 dark:border-primary-800 rounded-lg text-xs"
                        >
                            <option value="">-- None --</option>
                            {scenes.map(s => (
                                <option key={s.id} value={s.id}>
                                    Scene {s.number}: {s.name || 'Untitled'}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Related Shot */}
                    <div>
                        <label className="block text-xs font-semibold text-primary-700 dark:text-primary-300 mb-1 flex items-center gap-1">
                            <Film size={12} /> Related Shot
                        </label>
                        <select
                            value={relatedShotId}
                            onChange={(e) => setRelatedShotId(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-primary-900 border border-primary-200 dark:border-primary-800 rounded-lg text-xs"
                        >
                            <option value="">-- None --</option>
                            {availableShots.map(sh => (
                                <option key={sh.id} value={sh.id}>
                                    {sh.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Related Asset */}
                    <div>
                        <label className="block text-xs font-semibold text-primary-700 dark:text-primary-300 mb-1 flex items-center gap-1">
                            <Package size={12} /> Related Asset
                        </label>
                        <select
                            value={relatedAssetId}
                            onChange={(e) => setRelatedAssetId(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-primary-900 border border-primary-200 dark:border-primary-800 rounded-lg text-xs"
                        >
                            <option value="">-- None --</option>
                            {assets.map(a => (
                                <option key={a.id} value={a.id}>
                                    {a.name} {a.type ? `(${a.type})` : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Related Location */}
                    <div>
                        <label className="block text-xs font-semibold text-primary-700 dark:text-primary-300 mb-1 flex items-center gap-1">
                            <MapPin size={12} /> Related Location
                        </label>
                        <select
                            value={relatedLocationId}
                            onChange={(e) => setRelatedLocationId(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-primary-900 border border-primary-200 dark:border-primary-800 rounded-lg text-xs"
                        >
                            <option value="">-- None --</option>
                            {locations.map(l => (
                                <option key={l.id} value={l.id}>
                                    {l.name} {l.type ? `(${l.type})` : ''}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Threaded Activity / Comments Section */}
            <div className="space-y-3 pt-2">
                <label className="text-sm font-semibold text-primary-900 dark:text-primary-100 flex items-center gap-1.5">
                    <MessageSquare size={16} /> Comments & Activity ({comments.length})
                </label>

                {comments.length > 0 && (
                    <div className="space-y-2 max-h-48 overflow-y-auto p-2 bg-primary-50/50 dark:bg-black/20 rounded-xl border border-primary-100 dark:border-primary-800">
                        {comments.map(c => (
                            <div
                                key={c.id}
                                className="p-2.5 rounded-lg bg-white dark:bg-primary-900 border border-primary-100 dark:border-primary-800 text-xs space-y-1 shadow-2xs"
                            >
                                <div className="flex items-center justify-between text-primary-500 dark:text-primary-400 font-semibold text-[11px]">
                                    <span>{c.authorName}</span>
                                    <span>{new Date(c.createdAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}</span>
                                </div>
                                <p className="text-primary-800 dark:text-primary-200 whitespace-pre-wrap">
                                    {c.text}
                                </p>
                            </div>
                        ))}
                    </div>
                )}

                {/* Add new comment */}
                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder="Write a comment..."
                        value={newCommentText}
                        onChange={(e) => setNewCommentText(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleAddComment(e);
                            }
                        }}
                        className="flex-1 px-3 py-1.5 bg-white dark:bg-primary-900 border border-primary-200 dark:border-primary-800 rounded-lg text-xs text-primary-900 dark:text-white"
                    />
                    <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={handleAddComment}
                        disabled={!newCommentText.trim()}
                        className="text-xs h-8"
                    >
                        <Send size={12} /> Post
                    </Button>
                </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-primary-100 dark:border-primary-800 sticky bottom-0 bg-white dark:bg-primary-900 z-10">
                {initialTask && onDelete ? (
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => onDelete(initialTask.id)}
                        className="text-danger-500 hover:text-danger-700 hover:bg-danger-50 dark:hover:bg-danger-950/40 text-xs flex items-center gap-1.5"
                    >
                        <Trash2 size={14} /> Delete Task
                    </Button>
                ) : (
                    <div />
                )}

                <div className="flex items-center gap-3">
                    <Button type="button" variant="ghost" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={!name.trim()}>
                        {initialTask ? 'Save Changes' : 'Create Task'}
                    </Button>
                </div>
            </div>
        </form>
    );
};

export const TaskModal: React.FC<TaskModalProps> = ({
    isOpen,
    onClose,
    onSave,
    onDelete,
    initialTask,
    defaultCategory,
    defaultStatus,
    existingCategories,
}) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            size="2xl"
            title={initialTask ? 'Edit Task' : 'New Task'}
            icon={<CheckSquare size={20} className="text-secondary-600 dark:text-secondary-400" />}
        >
            <TaskForm
                key={initialTask?.id || defaultCategory || defaultStatus || 'new'}
                initialTask={initialTask}
                defaultCategory={defaultCategory}
                defaultStatus={defaultStatus}
                existingCategories={existingCategories}
                onClose={onClose}
                onSave={onSave}
                onDelete={onDelete}
            />
        </Modal>
    );
};
