'use no memo';
import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../hooks/useStore';
import { useProjects } from '../../hooks/useProjects';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import { Button } from '../../components/ui/Button';
import { MapPin, Plus, Upload, Download } from 'lucide-react';
import { ViewToggle } from '../../components/ui/ViewToggle';
import { ImageModal } from '../../components/ui/ImageModal';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageHeader } from '../../components/ui/PageHeader';
import { TypeBadge } from '../../components/ui/TypeBadge';
import { SortableCard } from '../../components/ui/SortableCard';
import { SortableTableRow } from '../../components/ui/SortableTableRow';
import type { Location } from '../../types/types';
import { useCSVImportExport } from '../../hooks/useCSVImportExport';
import {
    DndContext,
    closestCenter,
} from '@dnd-kit/core';
import {
    SortableContext,
    rectSortingStrategy,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortableList } from '../../hooks/useSortableList';
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
}) => (
    <SortableCard id={location.id} hoverable onClick={() => onNavigate(location.id)}>
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
                {location.type && <TypeBadge label={location.type} />}
            </div>
            <p className="text-primary-500 dark:text-primary-400 text-sm line-clamp-3 select-none">{location.description}</p>
            {location.geolocation && (
                <div className="flex items-center gap-2 text-xs text-primary-400 mt-auto pt-4 border-t border-primary-100 dark:border-primary-800 select-none">
                    <MapPin size={14} />
                    <span>{location.geolocation}</span>
                </div>
            )}
        </div>
    </SortableCard>
);

// Sortable List Item Component
const SortableLocationListItem = ({
    location,
    onNavigate
}: {
    location: Location;
    onNavigate: (id: string) => void;
}) => (
    <SortableTableRow id={location.id} onClick={() => onNavigate(location.id)}>
        <span className="flex-1 min-w-0 font-medium text-sm text-primary-900 dark:text-white truncate select-none">{location.name}</span>
        {location.geolocation && <span className="text-sm text-primary-400 truncate hidden md:block">{location.geolocation}</span>}
        {location.type && <TypeBadge label={location.type} />}
    </SortableTableRow>
);

export const LocationList: React.FC = () => {
    const { locations, replaceLocations, reorderLocations } = useStore();
    const { activeProjectId } = useProjects();
    const navigate = useNavigate();
    const { confirm, confirmDialog } = useConfirmDialog();
    const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'expanded' | 'slim'>(
        () => (localStorage.getItem('kopfkino-view-locations') as 'expanded' | 'slim') || 'expanded'
    );

    const { sensors, handleDragEnd } = useSortableList(locations, reorderLocations);
    const scrollRef = useRef<HTMLDivElement>(null);

    // eslint-disable-next-line react-hooks/incompatible-library
    const slimVirtualizer = useVirtualizer({
        count: locations.length,
        getScrollElement: () => scrollRef.current,
        estimateSize: () => 58,
        overscan: 8,
    });

    useEffect(() => {
        localStorage.setItem('kopfkino-view-locations', viewMode);
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
        confirmImport: (message) => confirm(message, { title: 'Import Locations', confirmLabel: 'Delete & Import' }),
    });

    return (
        <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto">
            <PageHeader
                title="Locations"
                actions={<>
                    <ViewToggle value={viewMode} onChange={setViewMode} />
                    <input type="file" accept=".csv" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
                    <Button onClick={handleImportClick} size="sm" variant="secondary" disabled title="Import disabled">
                        <Upload size={16} /> Import CSV
                    </Button>
                    <Button onClick={handleExportClick} size="sm" variant="secondary">
                        <Download size={16} /> Export CSV
                    </Button>
                    <Button onClick={() => navigate('new')} size="sm">
                        <Plus size={16} /> New Location
                    </Button>
                </>}
            />

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
                            <div className="border border-primary-200 dark:border-primary-700 rounded-lg overflow-hidden">
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
            {confirmDialog}
        </div>
    );
};
