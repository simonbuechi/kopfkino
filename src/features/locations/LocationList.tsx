import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../hooks/useStore';
import { useProjects } from '../../hooks/useProjects';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { MapPin, Plus, Upload, Download } from 'lucide-react';
import { ViewToggle } from '../../components/ui/ViewToggle';
import { DragHandle } from '../../components/ui/DragHandle';
import { ImageModal } from '../../components/ui/ImageModal';
import { EmptyState } from '../../components/ui/EmptyState';
import type { Location } from '../../types/types';
import { useCSVImportExport } from '../../hooks/useCSVImportExport';
import {
    DndContext,
    closestCenter,
} from '@dnd-kit/core';
import {
    SortableContext,
    useSortable,
    rectSortingStrategy,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortableList } from '../../hooks/useSortableList';
import { CSS } from '@dnd-kit/utilities';
import { useVirtualizer } from '@tanstack/react-virtual';

// Sortable Item Component
const SortableLocationCard = ({
    location,
    onClickImage,
    onNavigate
}: {
    location: Location;
    onClickImage: (url: string) => void;
    onNavigate: (id: string) => void;
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: location.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} className="h-full">
            <Card
                hoverable
                className="!p-0 flex flex-col h-full relative group/card cursor-pointer"
                onClick={() => onNavigate(location.id)}
            >
                <DragHandle variant="card" attributes={attributes} listeners={listeners} />

                <div
                    className="relative"
                    onClick={(e) => { if (location.thumbnailUrl) { e.stopPropagation(); onClickImage(location.thumbnailUrl); } }}
                >
                    {location.thumbnailUrl ? (
                        <img
                            src={location.thumbnailUrl}
                            alt={location.name}
                            className="w-full h-48 object-cover bg-primary-100 dark:bg-primary-800 hover:opacity-95 transition-opacity cursor-pointer"
                        />
                    ) : (
                        <div className="w-full h-48 bg-primary-100 dark:bg-primary-800 flex items-center justify-center text-primary-300 dark:text-primary-700">
                            <MapPin size={32} />
                        </div>
                    )}
                </div>

                <div className="p-6 flex flex-col gap-2 flex-1">
                    <div className="flex items-start justify-between gap-2">
                        <h3 className="text-lg font-semibold text-primary-900 dark:text-white select-none">{location.name}</h3>
                        {location.type && (
                            <span className="shrink-0 px-2 py-0.5 rounded text-xs font-bold bg-primary-200 dark:bg-primary-700 text-primary-700 dark:text-primary-300 select-none">
                                {location.type}
                            </span>
                        )}
                    </div>
                    <p className="text-primary-500 text-sm line-clamp-3 select-none">{location.description}</p>
                    {location.geolocation && (
                        <div className="flex items-center gap-2 text-xs text-primary-400 mt-auto pt-4 border-t border-primary-100 dark:border-primary-800 select-none">
                            <MapPin size={14} />
                            <span>{location.geolocation}</span>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
};

// Sortable List Item Component
const SortableLocationListItem = ({
    location,
    onNavigate
}: {
    location: Location;
    onNavigate: (id: string) => void;
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: location.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} className="w-full">
            <Card
                hoverable
                className="!p-3 flex items-center gap-4 relative group/item cursor-pointer"
                onClick={() => onNavigate(location.id)}
            >
                <DragHandle variant="list" attributes={attributes} listeners={listeners} />
                <div className="flex-1 min-w-0 flex items-center gap-3">
                    <h3 className="font-medium text-primary-900 dark:text-white truncate select-none">{location.name}</h3>
                    {location.type && (
                        <span className="shrink-0 px-2 py-0.5 rounded text-xs font-bold bg-primary-200 dark:bg-primary-700 text-primary-700 dark:text-primary-300 select-none">
                            {location.type}
                        </span>
                    )}
                </div>
            </Card>
        </div>
    );
};

export const LocationList: React.FC = () => {
    const { locations, replaceLocations, reorderLocations } = useStore();
    const { activeProjectId } = useProjects();
    const navigate = useNavigate();
    const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'expanded' | 'slim'>('expanded');

    const { sensors, handleDragEnd } = useSortableList(locations, reorderLocations);
    const scrollRef = useRef<HTMLDivElement>(null);

    const slimVirtualizer = useVirtualizer({
        count: locations.length,
        getScrollElement: () => scrollRef.current,
        estimateSize: () => 58,
        overscan: 8,
    });

    useEffect(() => {
        if (viewMode === 'slim') scrollRef.current?.scrollTo(0, 0);
    }, [viewMode]);

    const { fileInputRef, handleImportClick, handleFileChange, handleExportClick } = useCSVImportExport<Location>({
        items: locations,
        replaceItems: replaceLocations,
        columns: [
            { header: 'Name', getValue: l => l.name },
            { header: 'Description', getValue: l => l.description },
            { header: 'Geolocation', getValue: l => l.geolocation || '' },
            { header: 'Comment', getValue: l => l.comment || '' },
        ],
        buildItem: (row) => {
            const name = row['name'];
            if (!name) return null;
            return {
                id: crypto.randomUUID(),
                projectId: activeProjectId || '',
                name,
                description: row['description'] || '',
                geolocation: row['geolocation'] || undefined,
                comment: row['comment'] || undefined,
            };
        },
        entityName: 'location',
        filename: `kopfkino_locations_${new Date().toISOString().slice(0, 10)}.csv`,
    });

    return (
        <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-3xl font-bold text-primary-900 dark:text-white">Locations</h2>
                <div className="flex flex-wrap gap-2">
                    <ViewToggle value={viewMode} onChange={setViewMode} />
                    <input
                        type="file"
                        accept=".csv"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleFileChange}
                    />
                    <Button onClick={handleImportClick} size="sm" variant="secondary" disabled title="Import disabled">
                        <Upload size={16} />
                        Import CSV
                    </Button>
                    <Button onClick={handleExportClick} size="sm" variant="secondary">
                        <Download size={16} />
                        Export CSV
                    </Button>
                    <Button onClick={() => navigate('new')} size="sm">
                        <Plus size={16} />
                        New Location
                    </Button>
                </div>
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                {locations.length === 0 ? (
                    <EmptyState icon={<MapPin size={48} />} message="No locations yet. Create your first one!" />
                ) : (
                    <SortableContext
                        items={locations.map(l => l.id)}
                        strategy={viewMode === 'slim' ? verticalListSortingStrategy : rectSortingStrategy}
                    >
                        {viewMode === 'expanded' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {locations.map((location) => (
                                    <SortableLocationCard
                                        key={`card-${location.id}`}
                                        location={location}
                                        onClickImage={setFullscreenImage}
                                        onNavigate={navigate}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div
                                ref={scrollRef}
                                className="overflow-y-auto"
                                style={{ height: 'calc(100vh - 18rem)', minHeight: '300px' }}
                            >
                                <div style={{ height: slimVirtualizer.getTotalSize(), position: 'relative' }}>
                                    {slimVirtualizer.getVirtualItems().map(virtualRow => {
                                        const location = locations[virtualRow.index];
                                        return (
                                            <div
                                                key={virtualRow.key}
                                                data-index={virtualRow.index}
                                                ref={slimVirtualizer.measureElement}
                                                style={{
                                                    position: 'absolute',
                                                    top: 0,
                                                    transform: `translateY(${virtualRow.start}px)`,
                                                    width: '100%',
                                                    paddingBottom: '8px',
                                                }}
                                            >
                                                <SortableLocationListItem
                                                    location={location}
                                                    onNavigate={navigate}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </SortableContext>
                )}
            </DndContext>

            {fullscreenImage && (
                <ImageModal
                    src={fullscreenImage}
                    alt="Fullscreen"
                    onClose={() => setFullscreenImage(null)}
                    downloadFilename={`location-${new Date().getTime()}.png`}
                />
            )}
        </div>
    );
};
