import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../hooks/useStore';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { MapPin, Plus, Upload, Download, Edit, GripVertical, X } from 'lucide-react';
import type { Location } from '../../types/types';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    rectSortingStrategy
} from '@dnd-kit/sortable';
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
            <Card className="!p-0 flex flex-col h-full bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 relative group/card">
                {/* Drag Handle */}
                <div
                    {...attributes}
                    {...listeners}
                    className="absolute top-2 left-2 z-10 bg-black/40 text-white p-1.5 rounded cursor-grab active:cursor-grabbing opacity-0 group-hover/card:opacity-100 transition-opacity hover:bg-black/60"
                >
                    <GripVertical size={16} />
                </div>

                <div className="relative group cursor-pointer" onClick={() => location.thumbnailUrl && onClickImage(location.thumbnailUrl)}>
                    {location.thumbnailUrl ? (
                        <img
                            src={location.thumbnailUrl}
                            alt={location.name}
                            className="w-full h-48 object-cover bg-zinc-100 dark:bg-zinc-800 hover:opacity-95 transition-opacity"
                        />
                    ) : (
                        <div className="w-full h-48 bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-300 dark:text-zinc-700">
                            <MapPin size={32} />
                        </div>
                    )}
                </div>

                <div className="p-6 flex flex-col gap-2 flex-1">
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-white pointer-events-none select-none">{location.name}</h3>
                    <p className="text-zinc-500 text-sm line-clamp-3 mb-4 pointer-events-none select-none">{location.description}</p>
                    {location.geolocation && (
                        <div className="flex items-center gap-2 text-xs text-zinc-400 mt-auto pt-4 border-t border-zinc-100 dark:border-zinc-800 pointer-events-none select-none">
                            <MapPin size={14} />
                            <span>{location.geolocation}</span>
                        </div>
                    )}

                    <div className="mt-4 pt-2 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
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

export const LocationList: React.FC = () => {
    const { locations, replaceLocations, reorderLocations } = useStore();
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && fullscreenImage) {
                setFullscreenImage(null);
            }
        };

        if (fullscreenImage) {
            window.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [fullscreenImage]);

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
                <h2 className="text-3xl font-bold text-zinc-900 dark:text-white">Locations</h2>
                <div className="flex flex-wrap gap-2">
                    <input
                        type="file"
                        accept=".csv"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleFileChange}
                    />
                    <Button onClick={handleImportClick} size="sm">
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
                    <div className="flex flex-col items-center justify-center py-16 text-zinc-500 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                        <MapPin size={48} className="mb-4 opacity-50" />
                        <p>No locations yet. Create your first one!</p>
                    </div>
                ) : (
                    <SortableContext
                        items={locations.map(l => l.id)}
                        strategy={rectSortingStrategy}
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {locations.map((location) => (
                                <SortableLocationCard
                                    key={location.id}
                                    location={location}
                                    onClickImage={setFullscreenImage}
                                    onEdit={navigate}
                                />
                            ))}
                        </div>
                    </SortableContext>
                )}
            </DndContext>

            {/* Fullscreen Image Overlay */}
            {fullscreenImage && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
                    onClick={() => setFullscreenImage(null)}
                >
                    <button
                        className="absolute top-4 right-4 text-white hover:text-zinc-300 transition-colors bg-black/50 rounded-full p-2"
                        onClick={() => setFullscreenImage(null)}
                    >
                        <X size={24} />
                    </button>
                    <img
                        src={fullscreenImage}
                        alt="Fullscreen"
                        className="max-w-full max-h-full object-contain shadow-2xl rounded-lg"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    );
};
