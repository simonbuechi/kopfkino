import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../hooks/useStore';
import { useAuth } from '../../hooks/useAuth';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Tooltip } from '../../components/ui/Tooltip';
import {
    Edit, Trash2, Plus, Image as ImageIcon, Loader2, GripVertical,
    List, Grid, LayoutList, Download, Timer, Clapperboard, Video, Volume2, ChevronDown, ChevronRight, X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { uploadFile, uploadVideo, downloadImage, deleteFileByPath } from '../../services/storageService';
import type { Shot, ShotSetup } from '../../types/types';
import {
    DndContext,
    DragOverlay,
    closestCenter,
    PointerSensor,
    KeyboardSensor,
    useSensor,
    useSensors,
    type DragStartEvent,
    type DragOverEvent,
    type DragEndEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
    arrayMove,
    sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

interface ShotsListProps {
    sceneId: string;
    shots: Shot[];
    groups?: ShotSetup[];
    scenePlannedLength?: number;
    onSetupsChange?: (groups: ShotSetup[]) => void;
    onAddShot?: () => void;
    onEditShot?: (id: string) => void;
}

// ─── Setup Modal ────────────────────────────────────────────────────────────

interface SetupModalProps {
    initial?: { name: string; description: string };
    onConfirm: (name: string, description: string) => void;
    onClose: () => void;
}

const SetupModal: React.FC<SetupModalProps> = ({ initial, onConfirm, onClose }) => {
    const [name, setName] = useState(initial?.name ?? '');
    const [description, setDescription] = useState(initial?.description ?? '');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [onClose]);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!name.trim()) return;
        onConfirm(name.trim(), description.trim());
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="bg-white dark:bg-primary-900 rounded-xl shadow-2xl w-full max-w-md border border-primary-200 dark:border-primary-700"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between px-6 py-4 border-b border-primary-100 dark:border-primary-800">
                    <h2 className="font-semibold text-primary-900 dark:text-white text-base">
                        {initial ? 'Edit Setup' : 'New Setup'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-primary-400 hover:text-primary-700 dark:hover:text-primary-200 p-1 rounded-md transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-primary-700 dark:text-primary-300 mb-1 uppercase tracking-wider">
                            Name *
                        </label>
                        <input
                            ref={inputRef}
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="Setup name"
                            className="w-full rounded-lg border border-primary-300 dark:border-primary-700 bg-white dark:bg-primary-950 px-3 py-2 text-sm text-primary-900 dark:text-primary-100 focus:outline-none focus:ring-2 focus:ring-primary-600/20 dark:focus:ring-primary-400/20 focus:border-primary-600 dark:focus:border-primary-400 transition-colors"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-primary-700 dark:text-primary-300 mb-1 uppercase tracking-wider">
                            Description
                        </label>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Optional description"
                            rows={3}
                            className="w-full rounded-lg border border-primary-300 dark:border-primary-700 bg-white dark:bg-primary-950 px-3 py-2 text-sm text-primary-900 dark:text-primary-100 focus:outline-none focus:ring-2 focus:ring-primary-600/20 dark:focus:ring-primary-400/20 focus:border-primary-600 dark:focus:border-primary-400 transition-colors resize-none"
                        />
                    </div>
                    <div className="flex gap-2 justify-end pt-2">
                        <Button type="button" variant="secondary" size="sm" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" size="sm" disabled={!name.trim()}>
                            {initial ? 'Save' : 'Create Setup'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ─── Droppable Container ────────────────────────────────────────────────────

const DroppableContainer: React.FC<{ id: string; children: React.ReactNode }> = ({ id, children }) => {
    const { setNodeRef, isOver } = useDroppable({ id });
    return (
        <div
            ref={setNodeRef}
            className={`min-h-[40px] rounded-lg transition-colors ${isOver ? 'bg-primary-50 dark:bg-primary-800/30 ring-2 ring-primary-300 dark:ring-primary-600 ring-dashed' : ''}`}
        >
            {children}
        </div>
    );
};

// ─── SortableShotItem ────────────────────────────────────────────────────────

const SortableShotItem = ({
    shot,
    onUploadImage,
    onUploadVideo,
    onDelete,
    onRemoveVideo,
    onEdit,
    isUploading,
    viewMode,
    onImageClick,
    isDragOverlay,
}: {
    shot: Shot;
    onUploadImage: (shot: Shot, file: File) => void;
    onUploadVideo: (shot: Shot, file: File) => void;
    onDelete: (id: string) => void;
    onRemoveVideo: (shot: Shot) => void;
    onEdit: (id: string) => void;
    isUploading: boolean;
    viewMode: 'preview' | 'slim' | 'detailed';
    onImageClick: (url: string, alt: string) => void;
    isDragOverlay?: boolean;
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: shot.id });

    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);

    const style = isDragOverlay ? {} : {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
        opacity: isDragging ? 0.35 : 1,
        position: 'relative' as const,
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) onUploadImage(shot, file);
    };

    const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 10 * 1024 * 1024) {
                toast.error('Video file size must be less than 10MB.');
                return;
            }
            onUploadVideo(shot, file);
        }
    };

    const displayImage = shot.imageUrl || shot.visualizationUrl;

    const dragHandleProps = isDragOverlay ? {} : { ...attributes, ...listeners };

    if (viewMode === 'slim') {
        return (
            <div ref={isDragOverlay ? undefined : setNodeRef} style={style}
                className="flex flex-col bg-white dark:bg-primary-900 border border-primary-200 dark:border-primary-800 rounded-lg group overflow-hidden">
                <div className="flex items-center gap-3 p-3">
                    <div {...dragHandleProps}
                        className="text-primary-400 hover:text-primary-600 dark:hover:text-primary-300 cursor-grab active:cursor-grabbing p-1">
                        <GripVertical size={16} />
                    </div>
                    <div className="font-medium text-primary-900 dark:text-primary-100 flex-1 truncate select-none flex items-center gap-2">
                        {shot.name}
                        {(shot.length && shot.length > 0) ? (
                            <span className="text-xs text-primary-400 font-semibold">({shot.length}s)</span>
                        ) : null}
                        {shot.audio && <Volume2 size={12} className="text-primary-400" />}
                    </div>
                    <div className="flex gap-1">
                        <button type="button"
                            onClick={() => displayImage && onImageClick(displayImage, shot.name)}
                            disabled={!displayImage}
                            className="flex items-center justify-center h-8 w-8 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-30 text-primary-400 hover:text-primary-900 hover:bg-primary-100 dark:text-primary-500 dark:hover:text-primary-100 dark:hover:bg-primary-800"
                            title={displayImage ? "View Full Image" : "No Image"}>
                            <ImageIcon size={14} />
                        </button>
                        <button type="button" onClick={() => onEdit(shot.id)}
                            className="flex items-center justify-center h-8 w-8 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 text-primary-400 hover:text-primary-900 hover:bg-primary-100 dark:text-primary-500 dark:hover:text-primary-100 dark:hover:bg-primary-800"
                            title="Edit Shot">
                            <Edit size={14} />
                        </button>
                        <button type="button" onClick={() => onDelete(shot.id)}
                            className="flex items-center justify-center h-8 w-8 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 text-primary-400 hover:text-danger-600 hover:bg-danger-50 dark:text-primary-500 dark:hover:text-danger-400 dark:hover:bg-danger-900/20"
                            title="Delete Shot">
                            <Trash2 size={14} />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (viewMode === 'detailed') {
        return (
            <div ref={isDragOverlay ? undefined : setNodeRef} style={style}
                className="flex bg-white dark:bg-primary-900 border border-primary-200 dark:border-primary-800 rounded-lg group overflow-hidden items-stretch">
                <div {...dragHandleProps}
                    className="flex flex-col items-center justify-center bg-primary-50 dark:bg-primary-800/50 border-r border-primary-200 dark:border-primary-800 text-primary-400 hover:text-primary-600 dark:hover:text-primary-300 cursor-grab active:cursor-grabbing px-2">
                    <GripVertical size={16} />
                </div>
                <div
                    className="relative w-32 shrink-0 bg-primary-100 dark:bg-primary-800 cursor-pointer overflow-hidden group/image border-r border-primary-200 dark:border-primary-800"
                    onClick={() => displayImage && onImageClick(displayImage, shot.name)}>
                    {shot.videoUrl ? (
                        <video src={shot.videoUrl} className="w-full h-full object-cover" onClick={e => e.stopPropagation()} />
                    ) : displayImage ? (
                        <img src={displayImage} alt={shot.description} className="w-full h-full object-cover transition-transform duration-500 group-hover/image:scale-105" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-primary-300 dark:text-primary-700">
                            <ImageIcon size={24} />
                        </div>
                    )}
                </div>
                <div className="flex-1 p-4 flex flex-col gap-2 min-w-0">
                    <div className="flex justify-between items-start gap-4">
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-primary-900 dark:text-white leading-tight truncate" title={shot.name}>{shot.name}</h3>
                            {(shot.length && shot.length > 0) ? (
                                <span className="text-xs px-1.5 py-0.5 rounded bg-primary-100 dark:bg-primary-800 text-primary-500 font-semibold">{shot.length}s</span>
                            ) : null}
                            {shot.audio && <span className="text-primary-400" title="Has Audio"><Volume2 size={14} /></span>}
                        </div>
                        <div className="flex gap-1 shrink-0">
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                            <button type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                                className="flex items-center justify-center h-8 w-8 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 text-primary-500 hover:text-primary-900 hover:bg-primary-100 dark:text-primary-400 dark:hover:text-primary-100 dark:hover:bg-primary-800 disabled:opacity-50"
                                title="Upload Image">
                                {isUploading ? <Loader2 className="animate-spin" size={14} /> : <ImageIcon size={14} />}
                            </button>
                            <input type="file" ref={videoInputRef} className="hidden" accept="video/mp4,video/webm" onChange={handleVideoChange} />
                            <button type="button"
                                onClick={() => shot.videoUrl ? onRemoveVideo(shot) : videoInputRef.current?.click()}
                                disabled={isUploading}
                                className={`flex items-center justify-center h-8 w-8 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 hover:bg-primary-100 dark:hover:bg-primary-800 disabled:opacity-50 ${shot.videoUrl ? 'text-danger-500 hover:text-danger-600 dark:text-danger-400 dark:hover:text-danger-300' : 'text-primary-500 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-100'}`}
                                title={shot.videoUrl ? "Delete Video" : "Upload Video"}>
                                {isUploading ? <Loader2 className="animate-spin" size={14} /> : (shot.videoUrl ? <Trash2 size={14} /> : <Video size={14} />)}
                            </button>
                            <button type="button" onClick={() => onEdit(shot.id)}
                                className="flex items-center justify-center h-8 w-8 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 text-primary-500 hover:text-primary-900 hover:bg-primary-100 dark:text-primary-400 dark:hover:text-primary-100 dark:hover:bg-primary-800"
                                title="Edit Shot">
                                <Edit size={14} />
                            </button>
                            <button type="button" onClick={() => onDelete(shot.id)}
                                className="flex items-center justify-center h-8 w-8 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 text-primary-500 hover:text-danger-600 hover:bg-danger-50 dark:text-primary-400 dark:hover:text-danger-400 dark:hover:bg-danger-900/20"
                                title="Delete Shot">
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                        {shot.description && (
                            <div>
                                <h4 className="text-xs font-semibold text-primary-900 dark:text-white mb-1 uppercase tracking-wider">Description</h4>
                                <p className="text-sm text-primary-600 dark:text-primary-300">{shot.description}</p>
                            </div>
                        )}
                        {shot.notes && (
                            <div>
                                <h4 className="text-xs font-semibold text-primary-900 dark:text-white mb-1 uppercase tracking-wider">Notes</h4>
                                <p className="text-sm text-primary-500 dark:text-primary-400">{shot.notes}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // preview mode
    return (
        <div ref={isDragOverlay ? undefined : setNodeRef} style={style}>
            <Card className="flex flex-col !p-0 overflow-hidden group/card bg-white dark:bg-primary-900 border-primary-200 dark:border-primary-800">
                <div
                    className="relative w-full aspect-video bg-primary-100 dark:bg-primary-800 cursor-pointer overflow-hidden group/image"
                    onClick={() => displayImage && onImageClick(displayImage, shot.name)}>
                    {shot.videoUrl ? (
                        <video src={shot.videoUrl} className="w-full h-full object-cover" controls onClick={e => e.stopPropagation()} />
                    ) : displayImage ? (
                        <img src={displayImage} alt={shot.description} className="w-full h-full object-cover transition-transform duration-500 group-hover/image:scale-105" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-primary-300 dark:text-primary-700">
                            <ImageIcon size={32} />
                        </div>
                    )}
                    <div {...dragHandleProps}
                        className="absolute top-2 left-2 z-10 text-white bg-black/50 hover:bg-black/70 p-1 rounded cursor-grab active:cursor-grabbing transition-colors">
                        <GripVertical size={16} />
                    </div>
                </div>
                <div className="p-3 flex flex-col gap-1">
                    <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0 flex-1 flex flex-col">
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-primary-900 dark:text-white leading-tight truncate" title={shot.name}>{shot.name}</h3>
                                {(shot.length && shot.length > 0) ? (
                                    <span className="text-xs px-1.5 py-0.5 rounded bg-primary-100 dark:bg-primary-800 text-primary-500 font-semibold">{shot.length}s</span>
                                ) : null}
                                {shot.audio && <span className="text-primary-400" title="Has Audio"><Volume2 size={14} /></span>}
                            </div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                            <button type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                                className="flex items-center justify-center h-6 w-6 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 text-primary-500 hover:text-primary-900 hover:bg-primary-100 dark:text-primary-400 dark:hover:text-primary-100 dark:hover:bg-primary-800 disabled:opacity-50"
                                title="Upload Image">
                                {isUploading ? <Loader2 className="animate-spin" size={14} /> : <ImageIcon size={14} />}
                            </button>
                            <input type="file" ref={videoInputRef} className="hidden" accept="video/mp4,video/webm" onChange={handleVideoChange} />
                            <button type="button"
                                onClick={() => shot.videoUrl ? onRemoveVideo(shot) : videoInputRef.current?.click()}
                                disabled={isUploading}
                                className={`flex items-center justify-center h-6 w-6 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 hover:bg-primary-100 dark:hover:bg-primary-800 disabled:opacity-50 ${shot.videoUrl ? 'text-danger-500 hover:text-danger-600 dark:text-danger-400 dark:hover:text-danger-300' : 'text-primary-500 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-100'}`}
                                title={shot.videoUrl ? "Delete Video" : "Upload Video"}>
                                {isUploading ? <Loader2 className="animate-spin" size={14} /> : (shot.videoUrl ? <Trash2 size={14} /> : <Video size={14} />)}
                            </button>
                            <button type="button" onClick={() => onEdit(shot.id)}
                                className="flex items-center justify-center h-6 w-6 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 text-primary-500 hover:text-primary-900 hover:bg-primary-100 dark:text-primary-400 dark:hover:text-primary-100 dark:hover:bg-primary-800"
                                title="Edit Shot">
                                <Edit size={14} />
                            </button>
                            <button type="button" onClick={() => onDelete(shot.id)}
                                className="flex items-center justify-center h-6 w-6 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 text-primary-500 hover:text-danger-600 hover:bg-danger-50 dark:text-primary-400 dark:hover:text-danger-400 dark:hover:bg-danger-900/20"
                                title="Delete Shot">
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>
                    <p className="text-xs text-primary-500 line-clamp-2">{shot.description}</p>
                    {shot.notes && <p className="text-xs text-primary-400 mt-1 line-clamp-2">{shot.notes}</p>}
                </div>
            </Card>
        </div>
    );
};

// ─── SortableSetupHeader ────────────────────────────────────────────────────

const formatDuration = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
};

const SortableSetupHeader: React.FC<{
    group: ShotSetup;
    shotCount: number;
    totalLength: number;
    collapsed: boolean;
    onToggle: () => void;
    onEdit: () => void;
    onDelete: () => void;
}> = ({ group, shotCount, totalLength, collapsed, onToggle, onEdit, onDelete }) => {
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

// ─── ShotsList ───────────────────────────────────────────────────────────────

const UNGROUPED = '__ungrouped__';

export const ShotsList: React.FC<ShotsListProps> = ({
    sceneId,
    shots,
    groups = [],
    scenePlannedLength,
    onSetupsChange,
    onAddShot,
    onEditShot,
}) => {
    const { deleteShotFromScene, updateShotInScene, reorderShotsInScene } = useStore();
    const { user } = useAuth();
    const { confirm, confirmDialog } = useConfirmDialog();
    const navigate = useNavigate();

    const [uploadingId, setUploadingId] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'preview' | 'slim' | 'detailed'>('detailed');
    const [imageModal, setImageModal] = useState<{ url: string; alt: string } | null>(null);
    const [showSetupModal, setShowSetupModal] = useState(false);
    const [editingSetup, setEditingSetup] = useState<ShotSetup | null>(null);
    const [collapsedSetups, setCollapsedSetups] = useState<Set<string>>(new Set());

    // Local copies for DnD
    const [localShots, setLocalShots] = useState<Shot[]>(shots);
    const [localSetups, setLocalSetups] = useState<ShotSetup[]>(
        [...groups].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    );
    const [activeId, setActiveId] = useState<string | null>(null);

    useEffect(() => { setLocalShots(shots); }, [shots]);
    useEffect(() => {
        setLocalSetups([...groups].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
    }, [groups]);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    // ESC closes image modal
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setImageModal(null);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // ── Container helpers ──────────────────────────────────────────────────

    const findShotContainer = useCallback((shotId: string): string => {
        const shot = localShots.find(s => s.id === shotId);
        if (!shot) return UNGROUPED;
        if (!shot.groupId) return UNGROUPED;
        if (localSetups.find(g => g.id === shot.groupId)) return shot.groupId;
        return UNGROUPED;
    }, [localShots, localSetups]);

    const getShotsForContainer = useCallback((containerId: string): Shot[] => {
        if (containerId === UNGROUPED) {
            const validSetupIds = new Set(localSetups.map(g => g.id));
            return localShots.filter(s => !s.groupId || !validSetupIds.has(s.groupId));
        }
        return localShots.filter(s => s.groupId === containerId);
    }, [localShots, localSetups]);

    const isSetupHeader = (id: string) => id.startsWith('group-');

    // ── DnD handlers ──────────────────────────────────────────────────────

    const handleDragStart = ({ active }: DragStartEvent) => {
        setActiveId(active.id as string);
    };

    const handleDragOver = ({ active, over }: DragOverEvent) => {
        if (!over) return;
        const activeId = active.id as string;
        const overId = over.id as string;

        if (isSetupHeader(activeId)) return;

        const activeContainer = findShotContainer(activeId);

        // Determine target container
        let overContainer: string;
        if (overId === UNGROUPED) {
            overContainer = UNGROUPED;
        } else if (isSetupHeader(overId)) {
            overContainer = overId.replace('group-', '');
        } else {
            overContainer = findShotContainer(overId);
        }

        if (activeContainer === overContainer) return;

        setLocalShots(prev => prev.map(s => {
            if (s.id !== activeId) return s;
            const updated = { ...s };
            if (overContainer === UNGROUPED) {
                delete updated.groupId;
            } else {
                updated.groupId = overContainer;
            }
            return updated;
        }));
    };

    const handleDragEnd = ({ active, over }: DragEndEvent) => {
        setActiveId(null);
        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        if (isSetupHeader(activeId)) {
            // Reorder groups
            const activeSetupId = activeId.replace('group-', '');
            const overSetupId = overId.replace('group-', '');
            const oldIndex = localSetups.findIndex(g => g.id === activeSetupId);
            const newIndex = localSetups.findIndex(g => g.id === overSetupId);
            if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
                const reordered = arrayMove(localSetups, oldIndex, newIndex).map((g, i) => ({ ...g, order: i }));
                setLocalSetups(reordered);
                onSetupsChange?.(reordered);
            }
            return;
        }

        // Reorder shot within its container
        const container = findShotContainer(activeId);
        const containerShots = getShotsForContainer(container);
        const activeIndex = containerShots.findIndex(s => s.id === activeId);
        const overIndex = containerShots.findIndex(s => s.id === overId);

        let finalShots = localShots;
        if (activeIndex !== -1 && overIndex !== -1 && activeIndex !== overIndex) {
            const reorderedContainer = arrayMove(containerShots, activeIndex, overIndex);
            // Reconstruct full shots array preserving cross-container order
            const containerShotIds = new Set(containerShots.map(s => s.id));
            const otherShots = localShots.filter(s => !containerShotIds.has(s.id));
            // Interleave: maintain relative positions by reinserting at first occurrence
            const firstContainerIdx = localShots.findIndex(s => containerShotIds.has(s.id));
            finalShots = [
                ...localShots.slice(0, firstContainerIdx),
                ...reorderedContainer,
                ...otherShots.filter(s => !localShots.slice(0, firstContainerIdx).find(ls => ls.id === s.id)),
            ];
            // Simpler: just replace container shots in-place preserving their original indices in localShots
            const result = [...localShots];
            const indices = localShots.reduce<number[]>((acc, s, i) => {
                if (containerShotIds.has(s.id)) acc.push(i);
                return acc;
            }, []);
            indices.forEach((origIdx, i) => { result[origIdx] = reorderedContainer[i]; });
            finalShots = result;
        }

        setLocalShots(finalShots);
        reorderShotsInScene(sceneId, finalShots);
    };

    const activeShotForOverlay = activeId && !isSetupHeader(activeId)
        ? localShots.find(s => s.id === activeId)
        : null;

    // ── CRUD ──────────────────────────────────────────────────────────────

    const handleDelete = async (id: string) => {
        if (await confirm('Delete this shot?', { title: 'Delete Shot', confirmLabel: 'Delete' })) {
            deleteShotFromScene(sceneId, id);
        }
    };

    const handleUploadImage = async (shot: Shot, file: File) => {
        if (!user) return;
        setUploadingId(shot.id);
        try {
            const url = await uploadFile(file, user.uid);
            await updateShotInScene(sceneId, { ...shot, imageUrl: url });
        } catch {
            toast.error('Failed to upload image.');
        } finally {
            setUploadingId(null);
        }
    };

    const handleUploadVideo = async (shot: Shot, file: File) => {
        if (!user) return;
        setUploadingId(shot.id);
        try {
            const url = await uploadVideo(file, user.uid);
            await updateShotInScene(sceneId, { ...shot, videoUrl: url });
        } catch {
            toast.error('Failed to upload video.');
        } finally {
            setUploadingId(null);
        }
    };

    const handleRemoveVideo = async (shot: Shot) => {
        if (!shot.videoUrl) return;
        if (!await confirm('Delete video?', { title: 'Delete Video', confirmLabel: 'Delete' })) return;
        try {
            const deleted = await deleteFileByPath(shot.videoUrl);
            if (!deleted) throw new Error('Storage deletion failed');
            await updateShotInScene(sceneId, { ...shot, videoUrl: undefined });
        } catch {
            toast.error('Failed to delete video.');
        }
    };

    // ── Setup CRUD ─────────────────────────────────────────────────────────

    const handleCreateSetup = (name: string, description: string) => {
        const newSetup: ShotSetup = {
            id: crypto.randomUUID(),
            name,
            order: localSetups.length,
            ...(description ? { description } : {}),
        };
        const updated = [...localSetups, newSetup];
        setLocalSetups(updated);
        onSetupsChange?.(updated);
        setShowSetupModal(false);
    };

    const handleEditSetup = (name: string, description: string) => {
        if (!editingSetup) return;
        const updated = localSetups.map(g => {
            if (g.id !== editingSetup.id) return g;
            const next = { ...g, name };
            if (description) next.description = description;
            else delete next.description;
            return next;
        });
        setLocalSetups(updated);
        onSetupsChange?.(updated);
        setEditingSetup(null);
    };

    const handleDeleteSetup = async (groupId: string) => {
        if (!await confirm('Delete this group? Shots in it will become ungrouped.', { title: 'Delete Setup', confirmLabel: 'Delete' })) return;
        // Ungroup shots
        const updatedShots = localShots.map(s => {
            if (s.groupId !== groupId) return s;
            const updated = { ...s };
            delete updated.groupId;
            return updated;
        });
        const updatedSetups = localSetups.filter(g => g.id !== groupId);
        setLocalShots(updatedShots);
        setLocalSetups(updatedSetups);
        reorderShotsInScene(sceneId, updatedShots);
        onSetupsChange?.(updatedSetups);
    };

    const toggleCollapse = (groupId: string) => {
        setCollapsedSetups(prev => {
            const next = new Set(prev);
            next.has(groupId) ? next.delete(groupId) : next.add(groupId);
            return next;
        });
    };

    // ── Shot item props factory ────────────────────────────────────────────

    const shotItemProps = {
        onUploadImage: handleUploadImage,
        onUploadVideo: handleUploadVideo,
        onDelete: handleDelete,
        onRemoveVideo: handleRemoveVideo,
        onEdit: (id: string) => onEditShot ? onEditShot(id) : navigate(`shots/${id}`),
        viewMode,
        onImageClick: (url: string, alt: string) => setImageModal({ url, alt }),
    };

    const ungroupedShots = getShotsForContainer(UNGROUPED);
    const totalSeconds = localShots.reduce((acc, s) => acc + (s.length || 0), 0);

    // ── Setup IDs for SortableContext ─────────────────────────────────────
    const groupHeaderIds = localSetups.map(g => `group-${g.id}`);

    return (
        <div className="space-y-6 relative">
            {/* Toolbar */}
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Tooltip label="Number of shots">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-300 border border-amber-100 dark:border-amber-800">
                                <Clapperboard size={12} />
                                {localShots.length}
                            </div>
                        </Tooltip>
                        <Tooltip label="Total length of shots">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800">
                                <Timer size={12} />
                                {formatDuration(totalSeconds)}
                            </div>
                        </Tooltip>
                        {scenePlannedLength != null && (
                            <Tooltip label="Planned length">
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-300 border border-sky-100 dark:border-sky-800">
                                    <Timer size={12} />
                                    {formatDuration(scenePlannedLength)}
                                    <span className="font-normal opacity-70">planned</span>
                                </div>
                            </Tooltip>
                        )}
                    </div>
                    <div className="bg-primary-100 dark:bg-primary-800 p-1 rounded-lg flex gap-1">
                        <button onClick={() => setViewMode('preview')}
                            className={`p-1.5 rounded-md transition-all ${viewMode === 'preview' ? 'bg-white dark:bg-primary-700 text-primary-900 dark:text-white shadow-sm' : 'text-primary-500 dark:text-primary-400 hover:text-primary-900 dark:hover:text-primary-200'}`}
                            title="Preview View">
                            <Grid size={14} />
                        </button>
                        <button onClick={() => setViewMode('detailed')}
                            className={`p-1.5 rounded-md transition-all ${viewMode === 'detailed' ? 'bg-white dark:bg-primary-700 text-primary-900 dark:text-white shadow-sm' : 'text-primary-500 dark:text-primary-400 hover:text-primary-900 dark:hover:text-primary-200'}`}
                            title="Detailed View">
                            <LayoutList size={14} />
                        </button>
                        <button onClick={() => setViewMode('slim')}
                            className={`p-1.5 rounded-md transition-all ${viewMode === 'slim' ? 'bg-white dark:bg-primary-700 text-primary-900 dark:text-white shadow-sm' : 'text-primary-500 dark:text-primary-400 hover:text-primary-900 dark:hover:text-primary-200'}`}
                            title="Slim View">
                            <List size={14} />
                        </button>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button size="sm" onClick={() => setShowSetupModal(true)}>
                        <Plus size={16} /> Setup
                    </Button>
                    <Button size="sm" onClick={() => onAddShot ? onAddShot() : navigate(`shots/new`)}>
                        <Plus size={16} />  Shot
                    </Button>
                </div>
            </div>

            {/* DnD area */}
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
            >
                <div className="space-y-6">
                    {/* Ungrouped shots */}
                    {(ungroupedShots.length > 0 || localSetups.length === 0) && (
                        <div className="space-y-2">
                            {localSetups.length > 0 && (
                                <div className="text-xs font-semibold text-primary-400 dark:text-primary-500 uppercase tracking-wider px-1">
                                    Ungrouped
                                </div>
                            )}
                            <DroppableContainer id={UNGROUPED}>
                                <SortableContext items={ungroupedShots.map(s => s.id)} strategy={verticalListSortingStrategy}>
                                    <div className={`space-y-${viewMode === 'preview' ? '6' : '3'}`}>
                                        {ungroupedShots.length === 0 ? (
                                            <p className="text-primary-400 text-sm py-2 px-1">No shots yet.</p>
                                        ) : (
                                            ungroupedShots.map(shot => (
                                                <SortableShotItem
                                                    key={shot.id}
                                                    shot={shot}
                                                    isUploading={uploadingId === shot.id}
                                                    {...shotItemProps}
                                                />
                                            ))
                                        )}
                                    </div>
                                </SortableContext>
                            </DroppableContainer>
                        </div>
                    )}

                    {/* Setups */}
                    {localSetups.length > 0 && (
                        <SortableContext items={groupHeaderIds} strategy={verticalListSortingStrategy}>
                            <div className="space-y-4">
                                {localSetups.map(group => {
                                    const groupShots = getShotsForContainer(group.id);
                                    const groupLength = groupShots.reduce((acc, s) => acc + (s.length || 0), 0);
                                    const isCollapsed = collapsedSetups.has(group.id);
                                    return (
                                        <div key={group.id} className="space-y-2">
                                            <SortableSetupHeader
                                                group={group}
                                                shotCount={groupShots.length}
                                                totalLength={groupLength}
                                                collapsed={isCollapsed}
                                                onToggle={() => toggleCollapse(group.id)}
                                                onEdit={() => setEditingSetup(group)}
                                                onDelete={() => handleDeleteSetup(group.id)}
                                            />
                                            {!isCollapsed && (
                                                <DroppableContainer id={group.id}>
                                                    <SortableContext items={groupShots.map(s => s.id)} strategy={verticalListSortingStrategy}>
                                                        <div className={`space-y-${viewMode === 'preview' ? '6' : '3'} pl-4`}>
                                                            {groupShots.length === 0 ? (
                                                                <p className="text-primary-400 text-sm py-3 px-2">
                                                                    Drag shots here to add them to this group.
                                                                </p>
                                                            ) : (
                                                                groupShots.map(shot => (
                                                                    <SortableShotItem
                                                                        key={shot.id}
                                                                        shot={shot}
                                                                        isUploading={uploadingId === shot.id}
                                                                        {...shotItemProps}
                                                                    />
                                                                ))
                                                            )}
                                                        </div>
                                                    </SortableContext>
                                                </DroppableContainer>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </SortableContext>
                    )}
                </div>

                <DragOverlay>
                    {activeShotForOverlay && (
                        <SortableShotItem
                            shot={activeShotForOverlay}
                            isUploading={false}
                            isDragOverlay
                            {...shotItemProps}
                        />
                    )}
                </DragOverlay>
            </DndContext>

            {/* Full Screen Image Modal */}
            {imageModal && (
                <div
                    className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm"
                    onClick={() => setImageModal(null)}>
                    <div className="absolute top-4 right-4 flex gap-2">
                        <button
                            className="text-white hover:text-primary-300 p-2 bg-black/50 rounded-full transition-colors"
                            onClick={e => { e.stopPropagation(); downloadImage(imageModal.url, `shot-${Date.now()}.png`); }}
                            title="Download Image">
                            <Download size={24} />
                        </button>
                        <button
                            className="text-white hover:text-primary-300 p-2 bg-black/50 rounded-full transition-colors"
                            onClick={() => setImageModal(null)}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                        </button>
                    </div>
                    <img
                        src={imageModal.url}
                        alt={imageModal.alt}
                        className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl pointer-events-auto"
                        onClick={e => e.stopPropagation()}
                    />
                </div>
            )}

            {/* Setup modals */}
            {showSetupModal && (
                <SetupModal
                    onConfirm={handleCreateSetup}
                    onClose={() => setShowSetupModal(false)}
                />
            )}
            {editingSetup && (
                <SetupModal
                    initial={{ name: editingSetup.name, description: editingSetup.description ?? '' }}
                    onConfirm={handleEditSetup}
                    onClose={() => setEditingSetup(null)}
                />
            )}

            {confirmDialog}
        </div>
    );
};
