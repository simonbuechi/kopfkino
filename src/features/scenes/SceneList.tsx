'use no memo';
import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../hooks/useStore';
import { useProjects } from '../../hooks/useProjects';
import { useCSVImportExport } from '../../hooks/useCSVImportExport';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import { formatTime } from '../../utils/time';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatBadge } from '../../components/ui/StatBadge';
import { Clapperboard, Plus, MapPin, Upload, Download, LayoutList, GripVertical, AlignJustify, Users, Timer, Film } from 'lucide-react';
import type { Scene } from '../../types/types';
import {
    DndContext,
    closestCenter,
} from '@dnd-kit/core';
import {
    SortableContext,
    useSortable,
    verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { useSortableList } from '../../hooks/useSortableList';
import { CSS } from '@dnd-kit/utilities';
import { useVirtualizer } from '@tanstack/react-virtual';

interface SortableSceneItemProps {
    scene: Scene;
    viewMode: 'slim' | 'expanded';
    getLocationName: (id: string) => string;
    getCharacterNames: (ids?: string[]) => string[];
    onClick: () => void;
}

const SortableSceneItem = React.memo(({ scene, viewMode, getLocationName, getCharacterNames, onClick }: SortableSceneItemProps) => {
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

    const dragHandle = (
        <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 text-primary-400 hover:text-primary-600 dark:hover:text-primary-200 shrink-0"
            onClick={(e) => e.stopPropagation()}
        >
            <GripVertical size={16} />
        </div>
    );

    if (viewMode === 'slim') {
        return (
            <div ref={setNodeRef} style={style}>
                <div
                    className="flex gap-3 items-center px-3 py-2 bg-white dark:bg-primary-900 border-b border-primary-100 dark:border-primary-800 cursor-pointer hover:bg-primary-50 dark:hover:bg-primary-800/50 transition-colors"
                    onClick={onClick}
                >
                    {dragHandle}
                    <span className="font-mono text-sm font-bold w-10 text-center shrink-0 text-primary-500">{scene.number}</span>
                    <span className="flex-1 min-w-0 text-sm font-medium text-primary-900 dark:text-white truncate">{scene.name}</span>
                    <span className="text-sm text-primary-400 truncate hidden md:block">{getLocationName(scene.locationId)}</span>
                </div>
            </div>
        );
    }

    return (
        <div ref={setNodeRef} style={style}>
            <Card className="flex gap-4 items-center cursor-pointer p-6 flex-col sm:flex-row items-start sm:items-center" onClick={onClick} hoverable>
                {dragHandle}
                <div className="text-2xl font-bold text-primary-900 dark:text-white min-w-[60px] text-center font-mono">
                    {scene.number}
                </div>
                <div className="flex-1 space-y-2 w-full">
                    <h3 className="text-lg font-bold text-primary-900 dark:text-white">{scene.name}</h3>
                    <div className="flex flex-wrap gap-2">
                        <StatBadge color="primary" icon={<MapPin size={12} />}>
                            {getLocationName(scene.locationId)}
                        </StatBadge>
                        {characterNames.length > 0 && (
                            <StatBadge color="blue" icon={<Users size={12} />}>
                                {characterNames.join(', ')}
                            </StatBadge>
                        )}
                        <StatBadge color="amber" icon={<Clapperboard size={12} />}>
                            {scene.shots?.length || 0} Shots
                        </StatBadge>
                        <StatBadge color="emerald" icon={<Timer size={12} />}>
                            {formatTime(scene.shots?.reduce((acc, shot) => acc + (shot.length || 0), 0) || 0)}
                        </StatBadge>
                    </div>
                    <p className="text-primary-500 dark:text-primary-400 text-sm line-clamp-2">
                        {scene.description}
                    </p>
                </div>
            </Card>
        </div>
    );
});

export const SceneList: React.FC = () => {
    const { scenes, locations, characters, replaceScenes, reorderScenes } = useStore();
    const { activeProjectId } = useProjects();
    const navigate = useNavigate();
    const { confirm, confirmDialog } = useConfirmDialog();
    const [viewMode, setViewMode] = useState<'slim' | 'expanded'>(
        () => (localStorage.getItem('kopfkino-view-scenes') as 'slim' | 'expanded') || 'expanded'
    );

    const { sensors, handleDragEnd } = useSortableList(scenes, reorderScenes);
    const scrollRef = useRef<HTMLDivElement>(null);

    // eslint-disable-next-line react-hooks/incompatible-library
    const virtualizer = useVirtualizer({
        count: scenes.length,
        getScrollElement: () => scrollRef.current,
        estimateSize: () => viewMode === 'slim' ? 66 : 132,
        overscan: 8,
    });

    useEffect(() => {
        localStorage.setItem('kopfkino-view-scenes', viewMode);
        scrollRef.current?.scrollTo(0, 0);
    }, [viewMode]);

    const getLocationName = useCallback((id: string) => {
        return locations.find(l => l.id === id)?.name || 'Unknown Location';
    }, [locations]);

    const getCharacterNames = useCallback((ids?: string[]) => {
        if (!ids || ids.length === 0) return [];
        return ids.map(id => characters.find(c => c.id === id)?.name).filter(Boolean) as string[];
    }, [characters]);

    const { fileInputRef: sceneFileInputRef, handleImportClick: handleImportScenesClick, handleFileChange: handleSceneFileChange, handleExportClick: handleExportScenes } = useCSVImportExport<Scene>({
        items: scenes,
        replaceItems: replaceScenes,
        columns: [
            { header: 'Number', getValue: s => s.number },
            { header: 'Name', getValue: s => s.name },
            { header: 'Description', getValue: s => s.description },
            { header: 'Comment', getValue: s => s.comment || '' },
            { header: 'LocationId', getValue: s => s.locationId },
        ],
        buildItem: (row, ) => ({
            id: crypto.randomUUID(),
            projectId: activeProjectId || '',
            number: row['number'] || '',
            name: row['name'] || 'Untitled',
            description: row['description'] || '',
            comment: row['comment'] || undefined,
            locationId: row['locationid'] || '',
            order: 0,
        }),
        entityName: 'scene',
        filename: 'kopfkino_scenes.csv',
        confirmImport: (message) => confirm(message, { title: 'Import Scenes', confirmLabel: 'Delete & Import' }),
    });

    return (
        <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto">
            <PageHeader
                title="Scenes"
                actions={<>
                    <div className="flex items-center gap-1 bg-primary-100 dark:bg-primary-800 p-1 rounded-lg">
                        <button
                            onClick={() => setViewMode('slim')}
                            className={`p-1.5 rounded-md transition-all ${viewMode === 'slim' ? 'bg-white dark:bg-primary-700 shadow-sm text-primary-900 dark:text-white' : 'text-primary-500 hover:text-primary-700 dark:hover:text-primary-300'}`}
                            title="Slim View"
                        >
                            <AlignJustify size={16} />
                        </button>
                        <button
                            onClick={() => setViewMode('expanded')}
                            className={`p-1.5 rounded-md transition-all ${viewMode === 'expanded' ? 'bg-white dark:bg-primary-700 shadow-sm text-primary-900 dark:text-white' : 'text-primary-500 hover:text-primary-700 dark:hover:text-primary-300'}`}
                            title="Expanded View"
                        >
                            <LayoutList size={16} />
                        </button>
                    </div>
                    <input type="file" accept=".csv" ref={sceneFileInputRef} className="hidden" onChange={handleSceneFileChange} />
                    <Button size="sm" variant="secondary" onClick={handleImportScenesClick} disabled title="Import disabled">
                        <Upload size={14} /> Import
                    </Button>
                    <Button size="sm" variant="secondary" onClick={handleExportScenes}>
                        <Download size={14} /> Export
                    </Button>
                    <Button onClick={() => navigate('new')} size="sm">
                        <Plus size={16} /> New Scene
                    </Button>
                </>}
            />

            {scenes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-primary-500 border-2 border-dashed border-primary-200 dark:border-primary-800 rounded-xl">
                    <Film size={48} className="mb-4 opacity-50" />
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
                        <div className={viewMode === 'slim' ? 'border border-primary-200 dark:border-primary-700 rounded-lg overflow-hidden' : ''}>
                            <div
                                ref={scrollRef}
                                className="overflow-y-auto"
                                style={{ height: 'calc(100vh - 18rem)', minHeight: '300px' }}
                            >
                                <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
                                    {virtualizer.getVirtualItems().map(virtualRow => {
                                        const scene = scenes[virtualRow.index];
                                        return (
                                            <div
                                                key={virtualRow.key}
                                                data-index={virtualRow.index}
                                                ref={virtualizer.measureElement}
                                                style={{
                                                    position: 'absolute',
                                                    top: 0,
                                                    transform: `translateY(${virtualRow.start}px)`,
                                                    width: '100%',
                                                    paddingBottom: viewMode === 'slim' ? 0 : '16px',
                                                }}
                                            >
                                            <SortableSceneItem
                                                scene={scene}
                                                viewMode={viewMode}
                                                getLocationName={getLocationName}
                                                getCharacterNames={getCharacterNames}
                                                onClick={() => navigate(scene.id)}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        </div>
                    </SortableContext>
                </DndContext>
            )}
            {confirmDialog}
        </div>
    );
};
