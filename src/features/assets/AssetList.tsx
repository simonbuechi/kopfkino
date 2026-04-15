import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../hooks/useStore';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Package, Plus, Edit, GripVertical, LayoutGrid, List } from 'lucide-react';
import type { Asset } from '../../types/types';
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
const SortableAssetCard = ({
    asset,
    onEdit
}: {
    asset: Asset;
    onEdit: (id: string) => void;
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: asset.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} className="h-full">
            <Card className="!p-0 flex flex-col h-full bg-white dark:bg-primary-900 border-primary-200 dark:border-primary-800 relative group/card">
                {/* Drag Handle */}
                <div
                    {...attributes}
                    {...listeners}
                    className="absolute top-2 left-2 z-10 bg-black/40 text-white p-1.5 rounded cursor-grab active:cursor-grabbing opacity-0 group-hover/card:opacity-100 transition-opacity hover:bg-black/60"
                >
                    <GripVertical size={16} />
                </div>

                <div className="p-6 flex flex-col gap-2 flex-1">
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-col gap-1">
                            <h3 className="text-lg font-semibold text-primary-900 dark:text-white pointer-events-none select-none">{asset.name}</h3>
                            <span className="text-xs text-primary-400 font-medium uppercase tracking-wider">{asset.owner}</span>
                        </div>
                        {asset.type && (
                            <span className="shrink-0 px-2 py-0.5 rounded text-xs font-bold bg-primary-200 dark:bg-primary-700 text-primary-700 dark:text-primary-300 pointer-events-none select-none">
                                {asset.type}
                            </span>
                        )}
                    </div>
                    <p className="text-primary-500 text-sm line-clamp-3 mb-4 pointer-events-none select-none">{asset.description}</p>
                    
                    <div className="mt-auto pt-4 border-t border-primary-100 dark:border-primary-800 flex justify-end">
                        <Button
                            size="sm"
                            className="w-full"
                            onClick={() => onEdit(asset.id)}
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
const SortableAssetListItem = ({
    asset,
    onEdit
}: {
    asset: Asset;
    onEdit: (id: string) => void;
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: asset.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} className="w-full">
            <Card className="!p-3 flex items-center gap-4 bg-white dark:bg-primary-900 border-primary-200 dark:border-primary-800 relative group/item">
                {/* Drag Handle */}
                <div
                    {...attributes}
                    {...listeners}
                    className="text-primary-400 hover:text-primary-600 dark:hover:text-primary-300 cursor-grab active:cursor-grabbing"
                >
                    <GripVertical size={16} />
                </div>

                <Button
                    size="sm"
                    onClick={() => onEdit(asset.id)}
                    className="shrink-0 text-primary-500 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-100"
                >
                    <Edit size={14} /> Edit
                </Button>
                <div className="flex-1 min-w-0 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <h3 className="font-medium text-primary-900 dark:text-white truncate select-none">{asset.name}</h3>
                        <span className="text-xs text-primary-400 hidden sm:inline-block">— {asset.owner}</span>
                        {asset.type && (
                            <span className="shrink-0 px-2 py-0.5 rounded text-xs font-bold bg-primary-200 dark:bg-primary-700 text-primary-700 dark:text-primary-300 pointer-events-none select-none">
                                {asset.type}
                            </span>
                        )}
                    </div>
                </div>
            </Card>
        </div>
    );
};

export const AssetList: React.FC = () => {
    const { assets, reorderAssets } = useStore();
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState<'expanded' | 'slim'>('expanded');

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            const oldIndex = assets.findIndex((a) => a.id === active.id);
            const newIndex = assets.findIndex((a) => a.id === over?.id);

            const newOrder = arrayMove(assets, oldIndex, newIndex);
            reorderAssets(newOrder);
        }
    };

    return (
        <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-3xl font-bold text-primary-900 dark:text-white">Assets</h2>
                <div className="flex flex-wrap gap-2">
                    <div className="flex bg-primary-100 dark:bg-primary-800 rounded-lg p-1 mr-2">
                        <button
                            onClick={() => setViewMode('expanded')}
                            className={`p-1.5 rounded-md transition-all ${viewMode === 'expanded'
                                ? 'bg-white dark:bg-primary-700 text-primary-900 dark:text-white shadow-sm'
                                : 'text-primary-500 hover:text-primary-700 dark:hover:text-primary-300'
                                }`}
                            title="Expanded View"
                        >
                            <LayoutGrid size={16} />
                        </button>
                        <button
                            onClick={() => setViewMode('slim')}
                            className={`p-1.5 rounded-md transition-all ${viewMode === 'slim'
                                ? 'bg-white dark:bg-primary-700 text-primary-900 dark:text-white shadow-sm'
                                : 'text-primary-500 hover:text-primary-700 dark:hover:text-primary-300'
                                }`}
                            title="Slim View"
                        >
                            <List size={16} />
                        </button>
                    </div>
                    <Button onClick={() => navigate('new')} size="sm">
                        <Plus size={16} />
                        Add asset
                    </Button>
                </div>
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                {assets.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-primary-500 border-2 border-dashed border-primary-200 dark:border-primary-800 rounded-xl">
                        <Package size={48} className="mb-4 opacity-50" />
                        <p>No assets yet. Add your first one!</p>
                    </div>
                ) : (
                    <SortableContext
                        items={assets.map(a => a.id)}
                        strategy={rectSortingStrategy}
                    >
                        <div className={
                            viewMode === 'expanded'
                                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                                : "flex flex-col gap-2"
                        }>
                            {assets.map((asset) => (
                                viewMode === 'expanded' ? (
                                    <SortableAssetCard
                                        key={asset.id}
                                        asset={asset}
                                        onEdit={navigate}
                                    />
                                ) : (
                                    <SortableAssetListItem
                                        key={asset.id}
                                        asset={asset}
                                        onEdit={navigate}
                                    />
                                )
                            ))}
                        </div>
                    </SortableContext>
                )}
            </DndContext>
        </div>
    );
};
