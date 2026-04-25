'use no memo';
import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useStore } from '../../hooks/useStore';
import { useProjects } from '../../hooks/useProjects';
import { Button } from '../../components/ui/Button';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { Plus, Trash2, X, GripVertical, Pencil } from 'lucide-react';
import type { Act, Beat } from '../../types/types';
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
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { arrayMove } from '@dnd-kit/sortable';
import { useDroppable, useDraggable } from '@dnd-kit/core';

const MAX_ACTS = 5;

// ---------------------------------------------------------------------------
// Scene parsing
// ---------------------------------------------------------------------------

interface ParsedScene {
    key: string;
    heading: string;
    index: number;
}

function parseScenes(content: string): ParsedScene[] {
    const scenes: ParsedScene[] = [];
    for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (/^(INT\.|EXT\.|INT\.\/EXT\.)/.test(trimmed)) {
            scenes.push({ key: `sc-${scenes.length}`, heading: trimmed, index: scenes.length + 1 });
        }
    }
    return scenes;
}

// ---------------------------------------------------------------------------
// Scene card (sortable, in scenes column)
// ---------------------------------------------------------------------------

interface SceneCardProps {
    scene: ParsedScene;
    overlay?: boolean;
}

const SceneCard: React.FC<SceneCardProps> = ({ scene, overlay }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: scene.key,
        data: { type: 'scene' },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={overlay ? undefined : style}
            className={`group flex items-start gap-1.5 bg-white dark:bg-primary-900 border border-primary-200 dark:border-primary-800 rounded-lg p-2 ${overlay ? 'shadow-lg rotate-1' : 'hover:border-primary-300 dark:hover:border-primary-700'} transition-colors`}
        >
            <button
                {...attributes}
                {...listeners}
                className="mt-0.5 text-primary-300 dark:text-primary-700 hover:text-primary-500 dark:hover:text-primary-400 cursor-grab active:cursor-grabbing shrink-0"
            >
                <GripVertical size={14} />
            </button>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-primary-900 dark:text-white leading-tight break-words">
                    <span className="text-primary-400 dark:text-primary-600 tabular-nums mr-1">{scene.index}.</span>{scene.heading}
                </p>
            </div>
        </div>
    );
};

// ---------------------------------------------------------------------------
// Scenes column
// ---------------------------------------------------------------------------

interface ScenesColumnProps {
    scenes: ParsedScene[];
    sceneOrder: string[];
    localBeats: Beat[];
    acts: Act[];
}

const ScenesColumn: React.FC<ScenesColumnProps> = ({ scenes, sceneOrder, localBeats }) => {
    const { setNodeRef } = useDroppable({ id: 'scenes-column', data: { type: 'scenesColumn' } });

    const assignedKeys = new Set(localBeats.flatMap(b => b.sceneRefs ?? []));
    const unassignedOrder = sceneOrder.filter(k => !assignedKeys.has(k));
    const unassignedScenes = unassignedOrder
        .map(key => scenes.find(s => s.key === key))
        .filter(Boolean) as ParsedScene[];

    return (
        <div className="flex flex-col w-full min-h-0">
            <div className="mb-2 shrink-0">
                <p className="text-sm font-bold text-primary-900 dark:text-white uppercase tracking-wide">to be placed</p>
                <p className="text-xs text-primary-400 mt-0.5">{unassignedScenes.length} of {scenes.length}</p>
            </div>
            <div ref={setNodeRef} className="flex-1 overflow-y-auto min-h-[40px] rounded-lg">
                {scenes.length === 0 ? (
                    <p className="text-xs text-primary-400 dark:text-primary-600 italic px-1">No scene headings found in script.</p>
                ) : unassignedScenes.length === 0 ? (
                    <p className="text-xs text-primary-400 dark:text-primary-600 italic px-1">All scenes placed.</p>
                ) : (
                    <SortableContext items={unassignedOrder} strategy={verticalListSortingStrategy}>
                        <div className="flex flex-col gap-1.5 pb-1">
                            {unassignedScenes.map(scene => (
                                <SceneCard key={scene.key} scene={scene} />
                            ))}
                        </div>
                    </SortableContext>
                )}
            </div>
        </div>
    );
};

// ---------------------------------------------------------------------------
// Draggable scene chip (inside beat cards)
// ---------------------------------------------------------------------------

interface DraggableSceneChipProps {
    scene: ParsedScene;
    onUnassign?: () => void;
}

const DraggableSceneChip: React.FC<DraggableSceneChipProps> = ({ scene, onUnassign }) => {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: scene.key,
        data: { type: 'scene' },
    });

    return (
        <span
            ref={setNodeRef}
            className={`flex items-center gap-0.5 text-sm bg-primary-100 dark:bg-primary-800 rounded px-1 py-0.5 w-full ${isDragging ? 'opacity-0' : ''}`}
        >
            <button
                {...attributes}
                {...listeners}
                className="shrink-0 cursor-grab active:cursor-grabbing text-primary-300 dark:text-primary-600 hover:text-primary-500 dark:hover:text-primary-400"
            >
                <GripVertical size={9} />
            </button>
            <span className="text-primary-500 dark:text-primary-400 tabular-nums">{scene.index}.</span>
            <span className="truncate min-w-0 flex-1 ml-0.5 text-primary-700 dark:text-primary-200 font-medium">{scene.heading}</span>
            {onUnassign && (
                <button
                    onClick={e => { e.stopPropagation(); onUnassign(); }}
                    className="shrink-0 ml-0.5 text-primary-400 hover:text-danger-500 transition-colors"
                >
                    <X size={9} />
                </button>
            )}
        </span>
    );
};

// ---------------------------------------------------------------------------
// Beat card (sortable)
// ---------------------------------------------------------------------------

interface BeatCardProps {
    beat: Beat;
    onEdit: (beat: Beat) => void;
    onDelete: (beat: Beat) => void;
    onUnassignScene?: (sceneKey: string) => void;
    overlay?: boolean;
    showDescriptions?: boolean;
    assignedScenes?: ParsedScene[];
    isSceneTarget?: boolean;
}

const BeatCard: React.FC<BeatCardProps> = ({
    beat, onEdit, onDelete, onUnassignScene, overlay,
    showDescriptions = true, assignedScenes = [], isSceneTarget,
}) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: beat.id,
        data: { type: 'beat' },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={overlay ? undefined : style}
            className={`group relative bg-white dark:bg-primary-900 border rounded-lg p-2.5 ${isSceneTarget
                ? 'border-secondary-400 dark:border-secondary-500 bg-secondary-50 dark:bg-secondary-950/30'
                : 'border-primary-200 dark:border-primary-800 hover:border-primary-300 dark:hover:border-primary-700'
                } ${overlay ? 'shadow-lg rotate-1' : ''} transition-colors`}
        >
            <div className="flex items-start gap-1.5">
                <button
                    {...attributes}
                    {...listeners}
                    className="mt-0.5 text-primary-300 dark:text-primary-700 hover:text-primary-500 dark:hover:text-primary-400 cursor-grab active:cursor-grabbing shrink-0"
                >
                    <GripVertical size={14} />
                </button>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-primary-900 dark:text-white leading-tight">{beat.name}</p>
                    {showDescriptions && beat.description && (
                        <p className="text-sm font-medium text-primary-700 dark:text-primary-300 mt-0.5 leading-tight line-clamp-3">{beat.description}</p>
                    )}
                    {assignedScenes.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                            {assignedScenes.map(scene => (
                                <DraggableSceneChip
                                    key={scene.key}
                                    scene={scene}
                                    onUnassign={onUnassignScene ? () => onUnassignScene(scene.key) : undefined}
                                />
                            ))}
                        </div>
                    )}
                </div>
                {!overlay && (
                    <div className="opacity-0 group-hover:opacity-100 flex gap-0.5 shrink-0">
                        <button
                            onClick={() => onEdit(beat)}
                            className="p-1 rounded text-primary-400 hover:text-primary-700 dark:hover:text-primary-200 hover:bg-primary-100 dark:hover:bg-primary-800 transition-colors"
                        >
                            <Pencil size={11} />
                        </button>
                        <button
                            onClick={() => onDelete(beat)}
                            className="p-1 rounded text-primary-400 hover:text-danger-600 dark:hover:text-danger-400 hover:bg-primary-100 dark:hover:bg-primary-800 transition-colors"
                        >
                            <Trash2 size={11} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

// ---------------------------------------------------------------------------
// Droppable act column
// ---------------------------------------------------------------------------

interface ActColumnProps {
    act: Act;
    beats: Beat[];
    onEditAct: (act: Act) => void;
    onDeleteAct: (act: Act) => void;
    onEditBeat: (beat: Beat) => void;
    onDeleteBeat: (beat: Beat) => void;
    onUnassignScene: (sceneKey: string, beatId: string) => void;
    showDescriptions: boolean;
    parsedScenes: ParsedScene[];
    showScenes: boolean;
    hoveredBeatId: string | null;
    isAnySceneDragging: boolean;
}

const ActColumn: React.FC<ActColumnProps> = ({
    act, beats, onEditAct, onDeleteAct, onEditBeat, onDeleteBeat, onUnassignScene,
    showDescriptions, parsedScenes, showScenes, hoveredBeatId, isAnySceneDragging,
}) => {
    const { setNodeRef, isOver } = useDroppable({ id: act.id, data: { type: 'act' } });

    return (
        <div className="flex flex-col flex-1 min-w-0 min-h-0">
            <div className="group flex items-start gap-1 mb-2 shrink-0">
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-primary-900 dark:text-white uppercase tracking-wide truncate">{act.name}</p>
                    {showDescriptions && act.description && (
                        <p className="text-sm font-medium text-primary-700 dark:text-primary-300 mt-0.5 line-clamp-2 leading-tight">{act.description}</p>
                    )}
                </div>
                <div className="opacity-0 group-hover:opacity-100 flex gap-0.5 shrink-0 mt-0.5">
                    <button
                        onClick={() => onEditAct(act)}
                        className="p-1 rounded text-primary-400 hover:text-primary-700 dark:hover:text-primary-200 hover:bg-primary-100 dark:hover:bg-primary-800 transition-colors"
                    >
                        <Pencil size={11} />
                    </button>
                    <button
                        onClick={() => onDeleteAct(act)}
                        className="p-1 rounded text-primary-400 hover:text-danger-600 dark:hover:text-danger-400 hover:bg-primary-100 dark:hover:bg-primary-800 transition-colors"
                    >
                        <Trash2 size={11} />
                    </button>
                </div>
            </div>

            <div
                ref={setNodeRef}
                className={`flex-1 overflow-y-auto min-h-[40px] rounded-lg transition-colors ${isOver && !isAnySceneDragging ? 'bg-secondary-50 dark:bg-secondary-950/30' : ''}`}
            >
                <SortableContext items={beats.map(b => b.id)} strategy={verticalListSortingStrategy}>
                    <div className="flex flex-col gap-1.5 pb-1">
                        {beats.map(beat => {
                            const assignedScenes = showScenes
                                ? (beat.sceneRefs ?? []).map(k => parsedScenes.find(s => s.key === k)).filter(Boolean) as ParsedScene[]
                                : [];
                            return (
                                <BeatCard
                                    key={beat.id}
                                    beat={beat}
                                    onEdit={onEditBeat}
                                    onDelete={onDeleteBeat}
                                    onUnassignScene={showScenes ? key => onUnassignScene(key, beat.id) : undefined}
                                    showDescriptions={showDescriptions}
                                    assignedScenes={assignedScenes}
                                    isSceneTarget={showScenes && hoveredBeatId === beat.id}
                                />
                            );
                        })}
                    </div>
                </SortableContext>
            </div>
        </div>
    );
};

// ---------------------------------------------------------------------------
// Act / Beat form modal
// ---------------------------------------------------------------------------

interface FormModalProps {
    open: boolean;
    title: string;
    name: string;
    description: string;
    onNameChange: (v: string) => void;
    onDescriptionChange: (v: string) => void;
    onClose: () => void;
    onSubmit: () => void;
    submitting?: boolean;
    submitLabel?: string;
    acts?: Act[];
    actId?: string;
    onActIdChange?: (id: string) => void;
}

const FormModal: React.FC<FormModalProps> = ({
    open, title, name, description, onNameChange, onDescriptionChange,
    onClose, onSubmit, submitting, submitLabel = 'Save',
    acts, actId, onActIdChange,
}) => (
    <Dialog open={open} onClose={onClose} className="relative z-50">
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
            <DialogPanel className="w-full max-w-sm rounded-2xl bg-white dark:bg-primary-900 border border-primary-200 dark:border-primary-800 p-6 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                    <DialogTitle className="text-base font-semibold text-primary-900 dark:text-white">{title}</DialogTitle>
                    <Button variant="ghost" size="icon" onClick={onClose}><X size={16} /></Button>
                </div>
                <div className="space-y-3 mb-5">
                    {acts && onActIdChange && (
                        <select
                            value={actId}
                            onChange={e => onActIdChange(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-primary-200 dark:border-primary-700 bg-white dark:bg-primary-800 text-sm text-primary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-secondary-400"
                        >
                            {acts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                        </select>
                    )}
                    <input
                        autoFocus
                        type="text"
                        value={name}
                        onChange={e => onNameChange(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && onSubmit()}
                        placeholder="Name"
                        className="w-full px-3 py-2 rounded-lg border border-primary-200 dark:border-primary-700 bg-white dark:bg-primary-800 text-sm text-primary-900 dark:text-white placeholder:text-primary-400 focus:outline-none focus:ring-2 focus:ring-secondary-400"
                    />
                    <textarea
                        value={description}
                        onChange={e => onDescriptionChange(e.target.value)}
                        placeholder="Description (optional)"
                        rows={3}
                        className="w-full px-3 py-2 rounded-lg border border-primary-200 dark:border-primary-700 bg-white dark:bg-primary-800 text-sm text-primary-900 dark:text-white placeholder:text-primary-400 focus:outline-none focus:ring-2 focus:ring-secondary-400 resize-none"
                    />
                </div>
                <div className="flex justify-end gap-3">
                    <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
                    <Button size="sm" onClick={onSubmit} disabled={!name.trim() || submitting}>
                        {submitting ? 'Saving…' : submitLabel}
                    </Button>
                </div>
            </DialogPanel>
        </div>
    </Dialog>
);

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export const BeatsPage: React.FC = () => {
    const { acts, beats, script, saveAct, deleteAct, saveBeat, deleteBeat, saveBeats } = useStore();
    const { activeProjectId } = useProjects();

    // Local beats state for optimistic DnD updates
    const [localBeats, setLocalBeats] = useState<Beat[]>(beats);
    const isDragging = useRef(false);
    useEffect(() => {
        if (!isDragging.current) setLocalBeats(beats);
    }, [beats]);

    // Scenes
    const parsedScenes = useMemo(() => parseScenes(script?.content ?? ''), [script?.content]);
    const [showScenes, setShowScenes] = useState(false);
    const [localSceneOrder, setLocalSceneOrder] = useState<string[]>([]);
    const originalSceneOrderRef = useRef<string[]>([]);
    const activeSceneInColumnRef = useRef(false);
    const localBeatsRef = useRef(localBeats);
    useEffect(() => { localBeatsRef.current = localBeats; }, [localBeats]);
    useEffect(() => {
        if (!isDragging.current) setLocalSceneOrder(parsedScenes.map(s => s.key));
    }, [parsedScenes]);

    // DnD state
    const [activeId, setActiveId] = useState<string | null>(null);
    const [activeType, setActiveType] = useState<'beat' | 'scene' | null>(null);
    const [hoveredBeatId, setHoveredBeatId] = useState<string | null>(null);
    const activeBeat = localBeats.find(b => b.id === activeId);
    const activeScene = parsedScenes.find(s => s.key === activeId);

    // Act form
    const [actModal, setActModal] = useState<{ open: boolean; editing: Act | null }>({ open: false, editing: null });
    const [actName, setActName] = useState('');
    const [actDesc, setActDesc] = useState('');
    const [actSaving, setActSaving] = useState(false);

    // Beat form
    const [beatModal, setBeatModal] = useState<{ open: boolean; editing: Beat | null; actId: string }>({ open: false, editing: null, actId: '' });
    const [beatName, setBeatName] = useState('');
    const [beatDesc, setBeatDesc] = useState('');
    const [beatSaving, setBeatSaving] = useState(false);

    // Delete confirmations
    const [showDescriptions, setShowDescriptions] = useState(true);
    const [deleteActTarget, setDeleteActTarget] = useState<Act | null>(null);
    const [deleteBeatTarget, setDeleteBeatTarget] = useState<Beat | null>(null);
    const [deleteWorking, setDeleteWorking] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    // ---- Scene assignment ----

    const assignSceneToBeat = useCallback(async (sceneKey: string, beatId: string) => {
        const updated = localBeats.map(b => ({
            ...b,
            sceneRefs: b.id === beatId
                ? [...new Set([...(b.sceneRefs ?? []).filter(k => k !== sceneKey), sceneKey])]
                : (b.sceneRefs ?? []).filter(k => k !== sceneKey),
        }));
        setLocalBeats(updated);
        const changed = updated.filter((b, i) =>
            JSON.stringify(b.sceneRefs) !== JSON.stringify(localBeats[i]?.sceneRefs)
        );
        for (const b of changed) await saveBeat(b);
    }, [localBeats, saveBeat]);

    const unassignScene = useCallback(async (sceneKey: string, beatId: string) => {
        const updated = localBeats.map(b =>
            b.id === beatId ? { ...b, sceneRefs: (b.sceneRefs ?? []).filter(k => k !== sceneKey) } : b
        );
        setLocalBeats(updated);
        const beat = updated.find(b => b.id === beatId);
        if (beat) await saveBeat(beat);
    }, [localBeats, saveBeat]);

    // ---- Act CRUD ----

    const openAddAct = () => {
        setActName(''); setActDesc('');
        setActModal({ open: true, editing: null });
    };

    const openEditAct = (act: Act) => {
        setActName(act.name); setActDesc(act.description);
        setActModal({ open: true, editing: act });
    };

    const submitAct = async () => {
        if (!activeProjectId || !actName.trim()) return;
        setActSaving(true);
        const editing = actModal.editing;
        if (editing) {
            await saveAct({ ...editing, name: actName.trim(), description: actDesc.trim() });
        } else {
            await saveAct({
                id: crypto.randomUUID(),
                projectId: activeProjectId,
                name: actName.trim(),
                description: actDesc.trim(),
                order: acts.length,
            });
        }
        setActSaving(false);
        setActModal({ open: false, editing: null });
    };

    const confirmDeleteAct = async () => {
        if (!deleteActTarget) return;
        setDeleteWorking(true);
        const actBeats = localBeats.filter(b => b.actId === deleteActTarget.id);
        await Promise.all(actBeats.map(b => deleteBeat(b.id)));
        await deleteAct(deleteActTarget.id);
        setDeleteWorking(false);
        setDeleteActTarget(null);
    };

    // ---- Beat CRUD ----

    const openAddBeat = (actId: string) => {
        setBeatName(''); setBeatDesc('');
        setBeatModal({ open: true, editing: null, actId });
    };

    const openEditBeat = (beat: Beat) => {
        setBeatName(beat.name); setBeatDesc(beat.description);
        setBeatModal({ open: true, editing: beat, actId: beat.actId });
    };

    const submitBeat = async () => {
        if (!activeProjectId || !beatName.trim()) return;
        setBeatSaving(true);
        const { editing, actId } = beatModal;
        if (editing) {
            await saveBeat({ ...editing, name: beatName.trim(), description: beatDesc.trim() });
        } else {
            const actBeats = localBeats.filter(b => b.actId === actId);
            await saveBeat({
                id: crypto.randomUUID(),
                projectId: activeProjectId,
                actId,
                name: beatName.trim(),
                description: beatDesc.trim(),
                order: actBeats.length,
            });
        }
        setBeatSaving(false);
        setBeatModal({ open: false, editing: null, actId: '' });
    };

    const confirmDeleteBeat = async () => {
        if (!deleteBeatTarget) return;
        setDeleteWorking(true);
        await deleteBeat(deleteBeatTarget.id);
        setDeleteWorking(false);
        setDeleteBeatTarget(null);
    };

    // ---- DnD ----

    const handleDragStart = useCallback((event: DragStartEvent) => {
        isDragging.current = true;
        const type = (event.active.data.current?.type as 'beat' | 'scene') ?? 'beat';
        setActiveType(type);
        setActiveId(String(event.active.id));
        if (type === 'scene') {
            originalSceneOrderRef.current = [...localSceneOrder];
            const key = String(event.active.id);
            activeSceneInColumnRef.current = !localBeatsRef.current.some(b => (b.sceneRefs ?? []).includes(key));
        }
    }, [localSceneOrder]);

    const handleDragOver = useCallback((event: DragOverEvent) => {
        const { active, over } = event;
        if (!over) return;

        const activeItemType = active.data.current?.type as string;
        const overItemType = over.data.current?.type as string;
        const activeId = String(active.id);
        const overId = String(over.id);

        if (activeItemType === 'scene') {
            if (overItemType === 'scene') {
                if (activeSceneInColumnRef.current && activeId !== overId) {
                    setLocalSceneOrder(prev => {
                        const oldIdx = prev.indexOf(activeId);
                        const newIdx = prev.indexOf(overId);
                        if (oldIdx === -1 || newIdx === -1 || oldIdx === newIdx) return prev;
                        return arrayMove(prev, oldIdx, newIdx);
                    });
                }
                setHoveredBeatId(null);
            } else if (overItemType === 'beat') {
                setHoveredBeatId(overId);
            } else {
                setHoveredBeatId(null);
            }
            return;
        }

        // Beat drag logic
        setHoveredBeatId(null);
        if (activeId === overId) return;

        setLocalBeats(prev => {
            const activeBeat = prev.find(b => b.id === activeId);
            if (!activeBeat) return prev;

            const overBeat = prev.find(b => b.id === overId);
            const targetActId = overBeat ? overBeat.actId : overId;

            if (!acts.find(a => a.id === targetActId)) return prev;

            if (activeBeat.actId === targetActId) {
                if (!overBeat) return prev;
                const actBeats = prev.filter(b => b.actId === targetActId);
                const oldIdx = actBeats.findIndex(b => b.id === activeId);
                const newIdx = actBeats.findIndex(b => b.id === overId);
                if (oldIdx === newIdx) return prev;
                const reordered = arrayMove(actBeats, oldIdx, newIdx);
                return [...prev.filter(b => b.actId !== targetActId), ...reordered];
            } else {
                const targetBeats = prev.filter(b => b.actId === targetActId && b.id !== activeId);
                const movedBeat = { ...activeBeat, actId: targetActId };
                if (overBeat) {
                    targetBeats.splice(targetBeats.findIndex(b => b.id === overId), 0, movedBeat);
                } else {
                    targetBeats.push(movedBeat);
                }
                return [
                    ...prev.filter(b => b.actId !== targetActId && b.id !== activeId),
                    ...targetBeats,
                ];
            }
        });
    }, [acts]);

    const handleDragEnd = useCallback((event: DragEndEvent) => {
        isDragging.current = false;
        setActiveId(null);
        setActiveType(null);
        setHoveredBeatId(null);

        const { active, over } = event;
        const activeItemType = active.data.current?.type as string;

        if (activeItemType === 'scene') {
            if (!over) {
                setLocalSceneOrder(originalSceneOrderRef.current);
                return;
            }
            const overItemType = over.data.current?.type as string;
            if (overItemType === 'beat') {
                setLocalSceneOrder(originalSceneOrderRef.current);
                void assignSceneToBeat(String(active.id), String(over.id));
            } else if (overItemType !== 'scene') {
                setLocalSceneOrder(originalSceneOrderRef.current);
            }
            return;
        }

        if (!over) { setLocalBeats(beats); return; }

        const updated = acts.flatMap(act => {
            const actBeats = localBeats.filter(b => b.actId === act.id);
            return actBeats.map((b, i) => ({ ...b, order: i }));
        });
        setLocalBeats(updated);
        saveBeats(updated);
    }, [acts, localBeats, beats, saveBeats, assignSceneToBeat]);

    const handleDragCancel = useCallback(() => {
        isDragging.current = false;
        setActiveId(null);
        setActiveType(null);
        setHoveredBeatId(null);
        setLocalBeats(beats);
        setLocalSceneOrder(originalSceneOrderRef.current);
    }, [beats]);

    return (
        <div className="flex flex-col w-full" style={{ height: 'calc(100vh - 14.5rem)' }}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4 shrink-0">
                <h2 className="text-3xl font-bold text-primary-900 dark:text-white">Beats</h2>
                <div className="flex items-center gap-3">
                    {/* Scenes toggle */}
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                        <span className="text-sm font-medium text-primary-700 dark:text-primary-300">Scenes</span>
                        <button
                            role="switch"
                            aria-checked={showScenes}
                            onClick={() => setShowScenes(v => !v)}
                            className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary-400 ${showScenes ? 'bg-secondary-500' : 'bg-primary-200 dark:bg-primary-700'}`}
                        >
                            <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${showScenes ? 'translate-x-4' : 'translate-x-0'}`} />
                        </button>
                    </label>
                    {/* Descriptions toggle */}
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                        <span className="text-sm font-medium text-primary-700 dark:text-primary-300">Descriptions</span>
                        <button
                            role="switch"
                            aria-checked={showDescriptions}
                            onClick={() => setShowDescriptions(v => !v)}
                            className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary-400 ${showDescriptions ? 'bg-secondary-500' : 'bg-primary-200 dark:bg-primary-700'}`}
                        >
                            <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${showDescriptions ? 'translate-x-4' : 'translate-x-0'}`} />
                        </button>
                    </label>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openAddBeat(acts[0]?.id ?? '')}
                        disabled={acts.length === 0}
                    >
                        <Plus size={14} /> Add beat
                    </Button>
                    <Button
                        size="sm"
                        variant="secondary"
                        onClick={openAddAct}
                        disabled={acts.length >= MAX_ACTS}
                        title={acts.length >= MAX_ACTS ? `Maximum ${MAX_ACTS} acts` : undefined}
                    >
                        <Plus size={14} /> Add act
                    </Button>
                </div>
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
                onDragCancel={handleDragCancel}
            >
                <div className="flex gap-3 flex-1 min-h-0">
                    {/* Scenes column */}
                    {showScenes && (
                        <div className="flex flex-col w-52 shrink-0 min-h-0 bg-primary-50 dark:bg-primary-950 rounded-xl p-3 border border-primary-200 dark:border-primary-800">
                            <ScenesColumn
                                scenes={parsedScenes}
                                sceneOrder={localSceneOrder}
                                localBeats={localBeats}
                                acts={acts}
                            />
                        </div>
                    )}

                    {/* Act columns or empty state */}
                    {acts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center flex-1 text-primary-400 dark:text-primary-600 gap-3">
                            <p className="text-sm font-semibold">No acts yet</p>
                            <p className="text-xs opacity-70">Add an act to start outlining your script.</p>
                        </div>
                    ) : (
                        acts.map(act => (
                            <div
                                key={act.id}
                                className="flex flex-col flex-1 min-w-0 min-h-0 bg-primary-50 dark:bg-primary-950 rounded-xl p-3 border border-primary-200 dark:border-primary-800"
                            >
                                <ActColumn
                                    act={act}
                                    beats={localBeats.filter(b => b.actId === act.id)}
                                    onEditAct={openEditAct}
                                    onDeleteAct={setDeleteActTarget}
                                    onEditBeat={openEditBeat}
                                    onDeleteBeat={setDeleteBeatTarget}
                                    onUnassignScene={unassignScene}
                                    showDescriptions={showDescriptions}
                                    parsedScenes={parsedScenes}
                                    showScenes={showScenes}
                                    hoveredBeatId={hoveredBeatId}
                                    isAnySceneDragging={activeType === 'scene'}
                                />
                            </div>
                        ))
                    )}
                </div>

                <DragOverlay>
                    {activeType === 'beat' && activeBeat ? (
                        <BeatCard
                            beat={activeBeat}
                            onEdit={() => { }}
                            onDelete={() => { }}
                            overlay
                            showDescriptions={showDescriptions}
                        />
                    ) : activeType === 'scene' && activeScene ? (
                        <SceneCard scene={activeScene} overlay />
                    ) : null}
                </DragOverlay>
            </DndContext>

            {/* Act modal */}
            <FormModal
                open={actModal.open}
                title={actModal.editing ? 'Edit act' : 'Add act'}
                name={actName}
                description={actDesc}
                onNameChange={setActName}
                onDescriptionChange={setActDesc}
                onClose={() => setActModal({ open: false, editing: null })}
                onSubmit={submitAct}
                submitting={actSaving}
                submitLabel={actModal.editing ? 'Save' : 'Add act'}
            />

            {/* Beat modal */}
            <FormModal
                open={beatModal.open}
                title={beatModal.editing ? 'Edit beat' : 'Add beat'}
                name={beatName}
                description={beatDesc}
                onNameChange={setBeatName}
                onDescriptionChange={setBeatDesc}
                onClose={() => setBeatModal({ open: false, editing: null, actId: '' })}
                onSubmit={submitBeat}
                submitting={beatSaving}
                submitLabel={beatModal.editing ? 'Save' : 'Add beat'}
                acts={!beatModal.editing ? acts : undefined}
                actId={beatModal.actId}
                onActIdChange={id => setBeatModal(prev => ({ ...prev, actId: id }))}
            />

            {/* Delete act confirmation */}
            <Dialog open={!!deleteActTarget} onClose={() => setDeleteActTarget(null)} className="relative z-50">
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <DialogPanel className="w-full max-w-sm rounded-2xl bg-white dark:bg-primary-900 border border-primary-200 dark:border-primary-800 p-6 shadow-xl">
                        <div className="flex items-center gap-3 mb-3">
                            <Trash2 size={20} className="text-danger-500 shrink-0" />
                            <DialogTitle className="text-base font-semibold text-primary-900 dark:text-white">Delete act?</DialogTitle>
                        </div>
                        <p className="text-sm text-primary-500 dark:text-primary-400 mb-6">
                            "{deleteActTarget?.name}" and all its beats will be permanently deleted.
                        </p>
                        <div className="flex justify-end gap-3">
                            <Button variant="secondary" size="sm" onClick={() => setDeleteActTarget(null)}>Cancel</Button>
                            <Button variant="danger" size="sm" onClick={confirmDeleteAct} disabled={deleteWorking}>
                                {deleteWorking ? 'Deleting…' : 'Delete'}
                            </Button>
                        </div>
                    </DialogPanel>
                </div>
            </Dialog>

            {/* Delete beat confirmation */}
            <Dialog open={!!deleteBeatTarget} onClose={() => setDeleteBeatTarget(null)} className="relative z-50">
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <DialogPanel className="w-full max-w-sm rounded-2xl bg-white dark:bg-primary-900 border border-primary-200 dark:border-primary-800 p-6 shadow-xl">
                        <div className="flex items-center gap-3 mb-3">
                            <Trash2 size={20} className="text-danger-500 shrink-0" />
                            <DialogTitle className="text-base font-semibold text-primary-900 dark:text-white">Delete beat?</DialogTitle>
                        </div>
                        <p className="text-sm text-primary-500 dark:text-primary-400 mb-6">
                            "{deleteBeatTarget?.name}" will be permanently deleted.
                        </p>
                        <div className="flex justify-end gap-3">
                            <Button variant="secondary" size="sm" onClick={() => setDeleteBeatTarget(null)}>Cancel</Button>
                            <Button variant="danger" size="sm" onClick={confirmDeleteBeat} disabled={deleteWorking}>
                                {deleteWorking ? 'Deleting…' : 'Delete'}
                            </Button>
                        </div>
                    </DialogPanel>
                </div>
            </Dialog>
        </div>
    );
};
