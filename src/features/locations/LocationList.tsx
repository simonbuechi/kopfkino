import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../hooks/useStore';
import { useProjects } from '../../hooks/useProjects';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { MapPin, Plus, Upload, Download, Edit } from 'lucide-react';
import { ViewToggle } from '../../components/ui/ViewToggle';
import { DragHandle } from '../../components/ui/DragHandle';
import { ImageModal } from '../../components/ui/ImageModal';
import { EmptyState } from '../../components/ui/EmptyState';
import type { Location } from '../../types/types';
import {
    DndContext,
    closestCenter,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    useSortable,
    rectSortingStrategy
} from '@dnd-kit/sortable';
import { useDnDSensors } from '../../hooks/useDnDSensors';
import { CSS } from '@dnd-kit/utilities';

// Sortable Item Component
const SortableLocationCard = ({
    location,
    onClickImage,
    onEdit
}: {
    location: Location;
    onClickImage: (url: string) => void;
    onEdit: (id: string) => void;
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
            <Card className="!p-0 flex flex-col h-full bg-white dark:bg-primary-900 border-primary-200 dark:border-primary-800 relative group/card">
                <DragHandle variant="card" attributes={attributes} listeners={listeners} />

                <div className="relative group cursor-pointer" onClick={() => location.thumbnailUrl && onClickImage(location.thumbnailUrl)}>
                    {location.thumbnailUrl ? (
                        <img
                            src={location.thumbnailUrl}
                            alt={location.name}
                            className="w-full h-48 object-cover bg-primary-100 dark:bg-primary-800 hover:opacity-95 transition-opacity"
                        />
                    ) : (
                        <div className="w-full h-48 bg-primary-100 dark:bg-primary-800 flex items-center justify-center text-primary-300 dark:text-primary-700">
                            <MapPin size={32} />
                        </div>
                    )}
                </div>

                <div className="p-6 flex flex-col gap-2 flex-1">
                    <div className="flex items-start justify-between gap-2">
                        <h3 className="text-lg font-semibold text-primary-900 dark:text-white pointer-events-none select-none">{location.name}</h3>
                        {location.type && (
                            <span className="shrink-0 px-2 py-0.5 rounded text-xs font-bold bg-primary-200 dark:bg-primary-700 text-primary-700 dark:text-primary-300 pointer-events-none select-none">
                                {location.type}
                            </span>
                        )}
                    </div>
                    <p className="text-primary-500 text-sm line-clamp-3 mb-4 pointer-events-none select-none">{location.description}</p>
                    {location.geolocation && (
                        <div className="flex items-center gap-2 text-xs text-primary-400 mt-auto pt-4 border-t border-primary-100 dark:border-primary-800 pointer-events-none select-none">
                            <MapPin size={14} />
                            <span>{location.geolocation}</span>
                        </div>
                    )}

                    <div className="mt-4 pt-2 border-t border-primary-100 dark:border-primary-800 flex justify-end">
                        <Button
                            size="sm"
                            className="w-full"
                            onClick={() => onEdit(location.id)}
                        >
                            <Edit size={14} />
                            Edit
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
};

// Sortable List Item Component
const SortableLocationListItem = ({
    location,
    onEdit
}: {
    location: Location;
    onEdit: (id: string) => void;
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
            <Card className="!p-3 flex items-center gap-4 bg-white dark:bg-primary-900 border-primary-200 dark:border-primary-800 relative group/item">
                <DragHandle variant="list" attributes={attributes} listeners={listeners} />

                <Button
                    size="sm"
                    onClick={() => onEdit(location.id)}
                    className="shrink-0 text-primary-500 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-100"
                >
                    <Edit size={14} /> Edit
                </Button>
                <div className="flex-1 min-w-0 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <h3 className="font-medium text-primary-900 dark:text-white truncate select-none">{location.name}</h3>
                        {location.type && (
                            <span className="shrink-0 px-2 py-0.5 rounded text-xs font-bold bg-primary-200 dark:bg-primary-700 text-primary-700 dark:text-primary-300 pointer-events-none select-none">
                                {location.type}
                            </span>
                        )}
                    </div>
                </div>
            </Card>
        </div>
    );
};

export const LocationList: React.FC = () => {
    const { locations, replaceLocations, reorderLocations } = useStore();
    const { activeProjectId } = useProjects();
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'expanded' | 'slim'>('expanded');

    const sensors = useDnDSensors();

    const handleImportClick = () => {
        if (confirm('WARNING: Importing a CSV file will PERMANENTLY DELETE all existing locations. Do you want to proceed?')) {
            fileInputRef.current?.click();
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            if (!text) return;

            try {
                const lines = text.split('\n');
                const newLocations: Location[] = [];
                let startIndex = 0;
                if (lines[0].toLowerCase().includes('name')) {
                    startIndex = 1;
                }

                for (let i = startIndex; i < lines.length; i++) {
                    const line = lines[i].trim();
                    if (!line) continue;
                    const parts = line.split(',');
                    if (parts.length < 2) continue;
                    const name = parts[0]?.trim();
                    const description = parts[1]?.trim() || '';
                    const geolocation = parts[2]?.trim();
                    const comment = parts[3]?.trim();

                    if (name) {
                        newLocations.push({
                            id: crypto.randomUUID(),
                            projectId: activeProjectId || '',
                            name,
                            description,
                            geolocation: geolocation || undefined,
                            comment: comment || undefined,
                        });
                    }
                }

                if (newLocations.length > 0) {
                    replaceLocations(newLocations);
                    alert(`Successfully imported ${newLocations.length} locations.`);
                } else {
                    alert("No valid locations found in CSV.");
                }
            } catch (error) {
                console.error("Import failed:", error);
                alert("Failed to parse CSV file.");
            }
            if (fileInputRef.current) fileInputRef.current.value = '';
        };
        reader.readAsText(file);
    };

    const handleExportClick = () => {
        if (locations.length === 0) {
            alert("No locations to export.");
            return;
        }

        const headers = ["Name", "Description", "Geolocation", "Comment"];
        const csvContent = [
            headers.join(','),
            ...locations.map(loc => {
                const row = [
                    loc.name,
                    loc.description,
                    loc.geolocation || '',
                    loc.comment || ''
                ];
                return row.map(field => {
                    const stringField = String(field);
                    if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
                        return `"${stringField.replace(/"/g, '""')}"`;
                    }
                    return stringField;
                }).join(',');
            })
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `kopfkino_locations_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            const oldIndex = locations.findIndex((loc) => loc.id === active.id);
            const newIndex = locations.findIndex((loc) => loc.id === over?.id);

            const newOrder = arrayMove(locations, oldIndex, newIndex);
            reorderLocations(newOrder);
        }
    };

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
                    <Button onClick={handleImportClick} size="sm" disabled title="Import disabled">
                        <Upload size={16} />
                        Import CSV
                    </Button>
                    <Button onClick={handleExportClick} size="sm">
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
                        strategy={rectSortingStrategy}
                    >
                        <div className={
                            viewMode === 'expanded'
                                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                                : "flex flex-col gap-2"
                        }>
                            {locations.map((location) => (
                                viewMode === 'expanded' ? (
                                    <SortableLocationCard
                                        key={location.id}
                                        location={location}
                                        onClickImage={setFullscreenImage}
                                        onEdit={navigate}
                                    />
                                ) : (
                                    <SortableLocationListItem
                                        key={location.id}
                                        location={location}
                                        onEdit={navigate}
                                    />
                                )
                            ))}
                        </div>
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
