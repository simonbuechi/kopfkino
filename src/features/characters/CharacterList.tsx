import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../hooks/useStore';
import { useProjects } from '../../context/ProjectContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { User, Plus, Upload, Download, X, Edit, GripVertical, LayoutGrid, List } from 'lucide-react';
import { downloadImage } from '../../services/storageService';
import type { Character } from '../../types/types';
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
const SortableCharacterCard = ({
    character,
    onClickImage,
    onEdit
}: {
    character: Character;
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
    } = useSortable({ id: character.id });

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

                <div className="relative group cursor-pointer" onClick={() => character.imageUrl && onClickImage(character.imageUrl)}>
                    {character.imageUrl ? (
                        <img
                            src={character.imageUrl}
                            alt={character.name}
                            className="w-full h-48 object-cover bg-zinc-100 dark:bg-zinc-800 hover:opacity-95 transition-opacity"
                        />
                    ) : (
                        <div className="w-full h-48 bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-300 dark:text-zinc-700">
                            <User size={32} />
                        </div>
                    )}
                </div>

                <div className="p-4 flex flex-col gap-2 flex-1">
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-white pointer-events-none select-none">{character.name}</h3>
                    <p className="text-zinc-500 text-sm line-clamp-3 mb-4 pointer-events-none select-none">{character.description}</p>

                    <div className="mt-auto pt-2 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
                        <Button
                            size="sm"
                            className="w-full"
                            onClick={() => onEdit(character.id)}
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
const SortableCharacterListItem = ({
    character,
    onEdit
}: {
    character: Character;
    onEdit: (id: string) => void;
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: character.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} className="w-full">
            <Card className="!p-3 flex items-center gap-4 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 relative group/item">
                {/* Drag Handle */}
                <div
                    {...attributes}
                    {...listeners}
                    className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 cursor-grab active:cursor-grabbing"
                >
                    <GripVertical size={16} />
                </div>

                <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onEdit(character.id)}
                    className="shrink-0 h-8 w-8 p-0 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                >
                    <Edit size={18} />
                </Button>

                <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-zinc-900 dark:text-white truncate select-none">{character.name}</h3>
                </div>
            </Card>
        </div>
    );
};

export const CharacterList: React.FC = () => {
    const { characters, replaceCharacters, reorderCharacters } = useStore();
    const { activeProjectId } = useProjects();
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'expanded' | 'slim'>('expanded');

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
        if (confirm('WARNING: Importing a CSV file will PERMANENTLY DELETE all existing characters. Do you want to proceed?')) {
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
                const newCharacters: Character[] = [];
                let startIndex = 0;
                // Simple heuristic to skip header if present
                if (lines[0].toLowerCase().includes('name')) {
                    startIndex = 1;
                }

                for (let i = startIndex; i < lines.length; i++) {
                    const line = lines[i].trim();
                    if (!line) continue;
                    // Standard CSV parsing (handling basic cases)
                    const parts = line.split(',');
                    // Note: This simple split breaks on commas in fields.
                    // For a robust app, a proper CSV parser is recommended.
                    // Reusing the logic from LocationList for consistency.

                    if (parts.length < 2) continue;
                    const name = parts[0]?.trim();
                    const description = parts[1]?.trim() || '';
                    const comment = parts[2]?.trim();
                    const imageUrl = parts[3]?.trim();

                    if (name) {
                        const newChar: Character = {
                            id: crypto.randomUUID(),
                            projectId: activeProjectId || '',
                            name,
                            description,
                        };
                        if (comment) newChar.comment = comment;
                        if (imageUrl) newChar.imageUrl = imageUrl;

                        newCharacters.push(newChar);
                    }
                }

                if (newCharacters.length > 0) {
                    replaceCharacters(newCharacters);
                    alert(`Successfully imported ${newCharacters.length} characters.`);
                } else {
                    alert("No valid characters found in CSV.");
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
        if (characters.length === 0) {
            alert("No characters to export.");
            return;
        }

        const headers = ["Name", "Description", "Comment", "Image URL"];
        const csvContent = [
            headers.join(','),
            ...characters.map(char => {
                const row = [
                    char.name,
                    char.description,
                    char.comment || '',
                    char.imageUrl || ''
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
        link.setAttribute('download', `kopfkino_characters_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            const oldIndex = characters.findIndex((char) => char.id === active.id);
            const newIndex = characters.findIndex((char) => char.id === over?.id);

            const newOrder = arrayMove(characters, oldIndex, newIndex);
            reorderCharacters(newOrder);
        }
    };

    return (
        <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-3xl font-bold text-zinc-900 dark:text-white">Characters</h2>
                <div className="flex flex-wrap gap-2">
                    <div className="flex bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1 mr-2">
                        <button
                            onClick={() => setViewMode('expanded')}
                            className={`p-1.5 rounded-md transition-all ${viewMode === 'expanded'
                                ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm'
                                : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                                }`}
                            title="Expanded View"
                        >
                            <LayoutGrid size={16} />
                        </button>
                        <button
                            onClick={() => setViewMode('slim')}
                            className={`p-1.5 rounded-md transition-all ${viewMode === 'slim'
                                ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm'
                                : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                                }`}
                            title="Slim View"
                        >
                            <List size={16} />
                        </button>
                    </div>
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
                        New Character
                    </Button>
                </div>
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                {characters.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-zinc-500 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                        <User size={48} className="mb-4 opacity-50" />
                        <p>No characters yet. Create your first one!</p>
                    </div>
                ) : (
                    <SortableContext
                        items={characters.map(c => c.id)}
                        strategy={rectSortingStrategy}
                    >
                        <div className={
                            viewMode === 'expanded'
                                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                                : "flex flex-col gap-2"
                        }>
                            {characters.map((character) => (
                                viewMode === 'expanded' ? (
                                    <SortableCharacterCard
                                        key={character.id}
                                        character={character}
                                        onClickImage={setFullscreenImage}
                                        onEdit={navigate}
                                    />
                                ) : (
                                    <SortableCharacterListItem
                                        key={character.id}
                                        character={character}
                                        onEdit={navigate}
                                    />
                                )
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
                    <div className="absolute top-4 right-4 flex gap-2">
                        <button
                            className="text-white hover:text-zinc-300 transition-colors bg-black/50 rounded-full p-2"
                            onClick={(e) => {
                                e.stopPropagation();
                                downloadImage(fullscreenImage, `character-${new Date().getTime()}.png`);
                            }}
                            title="Download Image"
                        >
                            <Download size={24} />
                        </button>
                        <button
                            className="text-white hover:text-zinc-300 transition-colors bg-black/50 rounded-full p-2"
                            onClick={() => setFullscreenImage(null)}
                        >
                            <X size={24} />
                        </button>
                    </div>
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
