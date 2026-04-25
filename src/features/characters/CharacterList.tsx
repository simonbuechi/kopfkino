'use no memo';
import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../hooks/useStore';
import { useProjects } from '../../hooks/useProjects';
import { useCSVImportExport } from '../../hooks/useCSVImportExport';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import { Button } from '../../components/ui/Button';
import { User, Plus, Upload, Download, Edit, Trash2 } from 'lucide-react';
import { ViewToggle } from '../../components/ui/ViewToggle';
import { ImageModal } from '../../components/ui/ImageModal';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageHeader } from '../../components/ui/PageHeader';
import { TypeBadge } from '../../components/ui/TypeBadge';
import { SortableCard } from '../../components/ui/SortableCard';
import { SortableListItem } from '../../components/ui/SortableListItem';

import type { Character } from '../../types/types';
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
const SortableCharacterCard = ({
    character,
    onClickImage,
    onEdit
}: {
    character: Character;
    onClickImage: (url: string) => void;
    onEdit: (id: string) => void;
}) => (
    <SortableCard id={character.id} className="bg-white dark:bg-primary-900 border-primary-200 dark:border-primary-800">
        <div className="relative group cursor-pointer" onClick={() => character.imageUrl && onClickImage(character.imageUrl)}>
            {character.imageUrl ? (
                <img src={character.imageUrl} alt={character.name} className="w-full h-48 object-cover bg-primary-100 dark:bg-primary-800 hover:opacity-95 transition-opacity" />
            ) : (
                <div className="w-full h-48 bg-primary-100 dark:bg-primary-800 flex items-center justify-center text-primary-300 dark:text-primary-700">
                    <User size={32} />
                </div>
            )}
        </div>
        <div className="p-4 flex flex-col gap-2 flex-1">
            <h3 className="text-lg font-semibold text-primary-900 dark:text-white pointer-events-none select-none">{character.name}</h3>
            {character.type && <TypeBadge label={character.type} />}
            <p className="text-primary-500 dark:text-primary-400 text-sm line-clamp-3 mb-4 pointer-events-none select-none">{character.description}</p>
            <div className="mt-auto pt-2 border-t border-primary-100 dark:border-primary-800 flex justify-end">
                <Button size="sm" variant="secondary" className="w-full" onClick={() => onEdit(character.id)}>
                    <Edit size={14} /> Edit
                </Button>
            </div>
        </div>
    </SortableCard>
);

// Sortable List Item Component
const SortableCharacterListItem = ({
    character,
    onEdit,
    onDelete,
    onClickImage
}: {
    character: Character;
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
    onClickImage: (url: string) => void;
}) => (
    <SortableListItem id={character.id} className="bg-white dark:bg-primary-900 border-primary-200 dark:border-primary-800">
        <div className="flex-1 min-w-0 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => character.imageUrl && onClickImage(character.imageUrl)}
                    disabled={!character.imageUrl}
                    className="h-8 w-8 !p-0 shrink-0 text-primary-500 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-100 disabled:opacity-30 disabled:hover:bg-transparent"
                    title={character.imageUrl ? "View Image" : "No Image Available"}
                >
                    <User size={16} />
                </Button>
                <h3 className="font-medium text-primary-900 dark:text-white truncate select-none">{character.name}</h3>
                {character.type && <TypeBadge label={character.type} />}
            </div>
            <div className="flex items-center gap-1">
                <Button size="icon" variant="secondary" onClick={() => onEdit(character.id)} title="Edit Character">
                    <Edit size={16} />
                </Button>
                <Button size="sm" variant="danger" onClick={() => onDelete(character.id)} className="h-8 w-8 !p-0 transition-colors" title="Delete Character">
                    <Trash2 size={16} />
                </Button>
            </div>
        </div>
    </SortableListItem>
);

export const CharacterList: React.FC = () => {
    const { characters, replaceCharacters, reorderCharacters, deleteCharacter } = useStore();
    const { activeProjectId } = useProjects();
    const navigate = useNavigate();
    const { confirm, confirmDialog } = useConfirmDialog();
    const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'expanded' | 'slim'>('expanded');

    const { sensors, handleDragEnd } = useSortableList(characters, reorderCharacters);
    const scrollRef = useRef<HTMLDivElement>(null);

    // eslint-disable-next-line react-hooks/incompatible-library
    const slimVirtualizer = useVirtualizer({
        count: characters.length,
        getScrollElement: () => scrollRef.current,
        estimateSize: () => 58,
        overscan: 8,
    });

    useEffect(() => {
        if (viewMode === 'slim') scrollRef.current?.scrollTo(0, 0);
    }, [viewMode]);

    const { fileInputRef, handleImportClick, handleFileChange, handleExportClick } = useCSVImportExport<Character>({
        items: characters,
        replaceItems: replaceCharacters,
        columns: [
            { header: 'Name', getValue: c => c.name },
            { header: 'Description', getValue: c => c.description },
            { header: 'Comment', getValue: c => c.comment || '' },
            { header: 'Image URL', getValue: c => c.imageUrl || '' },
        ],
        buildItem: (row) => {
            const name = row['name'];
            if (!name) return null;
            return {
                id: crypto.randomUUID(),
                projectId: activeProjectId || '',
                name,
                description: row['description'] || '',
                comment: row['comment'] || undefined,
                imageUrl: row['image url'] || undefined,
            };
        },
        entityName: 'character',
        filename: `kopfkino_characters_${new Date().toISOString().slice(0, 10)}.csv`,
        confirmImport: (message) => confirm(message, { title: 'Import Characters', confirmLabel: 'Delete & Import' }),
    });

    const handleDelete = async (id: string) => {
        if (await confirm('Are you sure you want to delete this character?', { title: 'Delete Character', confirmLabel: 'Delete' })) {
            await deleteCharacter(id);
        }
    };

    return (
        <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto">
            <PageHeader
                title="Characters"
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
                        <Plus size={16} /> New Character
                    </Button>
                </>}
            />

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                {characters.length === 0 ? (
                    <EmptyState icon={<User size={48} />} message="No characters yet. Create your first one!" />
                ) : (
                    <SortableContext
                        items={characters.map(c => c.id)}
                        strategy={viewMode === 'slim' ? verticalListSortingStrategy : rectSortingStrategy}
                    >
                        {viewMode === 'expanded' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {characters.map((character) => (
                                    <SortableCharacterCard
                                        key={`card-${character.id}`}
                                        character={character}
                                        onClickImage={setFullscreenImage}
                                        onEdit={navigate}
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
                                        const character = characters[virtualRow.index];
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
                                                <SortableCharacterListItem
                                                    character={character}
                                                    onEdit={navigate}
                                                    onDelete={handleDelete}
                                                    onClickImage={setFullscreenImage}
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
                    downloadFilename={`character-${new Date().getTime()}.png`}
                />
            )}
            {confirmDialog}
        </div>
    );
};
