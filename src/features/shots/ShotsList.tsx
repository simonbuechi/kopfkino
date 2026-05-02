import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../hooks/useStore';
import { useAuth } from '../../hooks/useAuth';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import { Button } from '../../components/ui/Button';
import { Tooltip } from '../../components/ui/Tooltip';
import { Plus, List, Grid, LayoutList, Download, Clapperboard, Timer } from 'lucide-react';
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
    useDroppable,
    type DragStartEvent,
    type DragOverEvent,
    type DragEndEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    verticalListSortingStrategy,
    arrayMove,
    sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { SetupModal } from './SetupModal';
import { SortableShotItem } from './SortableShotItem';
import { SortableSetupHeader } from './SortableSetupHeader';
import { formatDuration } from './formatDuration';

interface ShotsListProps {
    sceneId: string;
    shots: Shot[];
    groups?: ShotSetup[];
    scenePlannedLength?: number;
    onSetupsChange?: (groups: ShotSetup[]) => void;
    onAddShot?: () => void;
    onEditShot?: (id: string) => void;
}

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

        const container = findShotContainer(activeId);
        const containerShots = getShotsForContainer(container);
        const activeIndex = containerShots.findIndex(s => s.id === activeId);
        const overIndex = containerShots.findIndex(s => s.id === overId);

        let finalShots = localShots;
        if (activeIndex !== -1 && overIndex !== -1 && activeIndex !== overIndex) {
            const reorderedContainer = arrayMove(containerShots, activeIndex, overIndex);
            const containerShotIds = new Set(containerShots.map(s => s.id));
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
            if (next.has(groupId)) { next.delete(groupId); } else { next.add(groupId); }
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
