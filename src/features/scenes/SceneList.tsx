import React, { useRef, type ChangeEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../hooks/useStore';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Clapperboard, Plus, MapPin, Upload, Download, LayoutList, GripVertical, AlignJustify, Users, Timer, Film } from 'lucide-react';
import type { Scene } from '../../types/types';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableSceneItemProps {
    scene: Scene;
    viewMode: 'slim' | 'expanded';
    getLocationName: (id: string) => string;
    getCharacterNames: (ids?: string[]) => string[];
    onClick: () => void;
}

const SortableSceneItem = ({ scene, viewMode, getLocationName, getCharacterNames, onClick }: SortableSceneItemProps) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: scene.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
        opacity: isDragging ? 0.5 : 1,
        position: 'relative' as const,
    };

    const characterNames = getCharacterNames(scene.characters);

    return (
        <div ref={setNodeRef} style={style}>
            <Card
                className={`flex gap-4 items-center cursor-pointer transition-all ${viewMode === 'slim' ? 'p-3' : 'p-6 flex-col sm:flex-row items-start sm:items-center'}`}
                onClick={onClick}
                hoverable
            >
                {/* Drag Handle */}
                <div
                    {...attributes}
                    {...listeners}
                    className="cursor-grab active:cursor-grabbing p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                    onClick={(e) => e.stopPropagation()}
                >
                    <GripVertical size={20} />
                </div>

                {viewMode === 'slim' ? (
                    // Slim Mode
                    <div className="flex-1 flex items-center gap-4">
                        <div className="font-mono font-bold text-xl min-w-[40px] text-center text-zinc-500">{scene.number}</div>
                        <div className="font-semibold text-lg text-zinc-900 dark:text-white truncate">{scene.name}</div>
                    </div>
                ) : (
                    // Expanded Mode
                    <>
                        <div className="text-2xl font-bold text-zinc-900 dark:text-white min-w-[60px] text-center font-mono">
                            {scene.number}
                        </div>
                        <div className="flex-1 space-y-2 w-full">
                            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">{scene.name}</h3>
                            <div className="flex flex-wrap gap-2">
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                                    <MapPin size={12} />
                                    {getLocationName(scene.locationId)}
                                </div>
                                {characterNames.length > 0 && (
                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 border border-blue-100 dark:border-blue-800">
                                        <Users size={12} />
                                        {characterNames.join(', ')}
                                    </div>
                                )}
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-300 border border-amber-100 dark:border-amber-800">
                                    <Film size={12} />
                                    {scene.shots?.length || 0} Shots
                                </div>
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800">
                                    <Timer size={12} />
                                    {(() => {
                                        const totalSeconds = scene.shots?.reduce((acc, shot) => acc + (shot.length || 0), 0) || 0;
                                        const minutes = Math.floor(totalSeconds / 60);
                                        const seconds = totalSeconds % 60;
                                        if (minutes > 0) {
                                            return `${minutes}m ${seconds}s`;
                                        }
                                        return `${seconds}s`;
                                    })()}
                                </div>
                            </div>
                            <p className="text-zinc-500 dark:text-zinc-400 text-sm line-clamp-2">
                                {scene.description}
                            </p>
                        </div>
                    </>
                )}
            </Card>
        </div>
    );
};

export const SceneList: React.FC = () => {
    const { scenes, locations, characters, replaceScenes, reorderScenes } = useStore();
    const navigate = useNavigate();
    const sceneFileInputRef = useRef<HTMLInputElement>(null);
    const [viewMode, setViewMode] = useState<'slim' | 'expanded'>('expanded');

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const getLocationName = (id: string) => {
        return locations.find(l => l.id === id)?.name || 'Unknown Location';
    };

    const getCharacterNames = (ids?: string[]) => {
        if (!ids || ids.length === 0) return [];
        return ids.map(id => characters.find(c => c.id === id)?.name).filter(Boolean) as string[];
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            const oldIndex = scenes.findIndex((s) => s.id === active.id);
            const newIndex = scenes.findIndex((s) => s.id === over?.id);

            const newOrder = arrayMove(scenes, oldIndex, newIndex);
            reorderScenes(newOrder);
        }
    };

    // --- SCENES IMPORT/EXPORT ---
    const handleImportScenesClick = () => {
        if (confirm('WARNING: Importing Scenes will PERMANENTLY DELETE all existing scenes. Proceed?')) {
            sceneFileInputRef.current?.click();
        }
    };

    const handleSceneFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            if (!text) return;
            try {
                const lines = text.split('\n');
                const newScenes: Scene[] = [];
                let startIndex = 0;
                if (lines[0].toLowerCase().includes('number')) startIndex = 1;

                for (let i = startIndex; i < lines.length; i++) {
                    const line = lines[i].trim();
                    if (!line) continue;
                    const parts = line.split(',');
                    if (parts.length < 2) continue;

                    newScenes.push({
                        id: crypto.randomUUID(),
                        number: parts[0]?.trim() || '',
                        name: parts[1]?.trim() || 'Untitled',
                        description: parts[2]?.trim() || '',
                        comment: parts[3]?.trim(),
                        locationId: parts[4]?.trim() || '',
                        order: i // Maintain import order
                    });
                }
                if (newScenes.length > 0) {
                    replaceScenes(newScenes);
                    alert(`Imported ${newScenes.length} scenes.`);
                }
            } catch (err) {
                console.error(err);
                alert('Failed to parse scenes CSV.');
            }
            if (sceneFileInputRef.current) sceneFileInputRef.current.value = '';
        };
        reader.readAsText(file);
    };

    const handleExportScenes = () => {
        if (scenes.length === 0) return alert('No scenes to export.');
        const headers = ["Number", "Name", "Description", "Comment", "LocationId"];
        const csv = [
            headers.join(','),
            ...scenes.map(s => [
                s.number,
                `"${s.name.replace(/"/g, '""')}"`,
                `"${s.description.replace(/"/g, '""')}"`,
                `"${(s.comment || '').replace(/"/g, '""')}"`,
                s.locationId
            ].join(','))
        ].join('\n');
        downloadCsv(csv, 'kopfkino_scenes.csv');
    };


    const downloadCsv = (content: string, filename: string) => {
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-3xl font-bold text-zinc-900 dark:text-white">Scenes</h2>
                <div className="flex flex-col gap-3 items-end">
                    <div className="flex flex-wrap gap-2 justify-end items-center">
                        {/* View Mode Toggle */}
                        <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg mr-2">
                            <button
                                onClick={() => setViewMode('slim')}
                                className={`p-1.5 rounded-md transition-all ${viewMode === 'slim' ? 'bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                                title="Slim View"
                            >
                                <AlignJustify size={16} />
                            </button>
                            <button
                                onClick={() => setViewMode('expanded')}
                                className={`p-1.5 rounded-md transition-all ${viewMode === 'expanded' ? 'bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                                title="Expanded View"
                            >
                                <LayoutList size={16} />
                            </button>
                        </div>

                        <input type="file" accept=".csv" ref={sceneFileInputRef} className="hidden" onChange={handleSceneFileChange} />

                        <Button size="sm" onClick={handleImportScenesClick} disabled title="Import disabled">
                            <Upload size={14} /> Import
                        </Button>
                        <Button size="sm" onClick={handleExportScenes}>
                            <Download size={14} /> Export
                        </Button>
                        <Button onClick={() => navigate('new')} size="sm">
                            <Plus size={16} /> New Scene
                        </Button>
                    </div>
                </div>
            </div>

            {scenes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-zinc-500 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                    <Clapperboard size={48} className="mb-4 opacity-50" />
                    <p>No scenes yet. Create your first one!</p>
                </div>
            ) : (
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={scenes.map(s => s.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        <div className="flex flex-col gap-4">
                            {scenes.map((scene) => (
                                <SortableSceneItem
                                    key={scene.id}
                                    scene={scene}
                                    viewMode={viewMode}
                                    getLocationName={getLocationName}
                                    getCharacterNames={getCharacterNames}
                                    onClick={() => navigate(scene.id)}
                                />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
            )}
        </div>
    );
};
