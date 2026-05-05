import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../hooks/useStore';
import { Button } from '../../components/ui/Button';
import { Package, Plus, Edit } from 'lucide-react';
import { ViewToggle } from '../../components/ui/ViewToggle';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageHeader } from '../../components/ui/PageHeader';
import { TypeBadge } from '../../components/ui/TypeBadge';
import { SortableCard } from '../../components/ui/SortableCard';
import { SortableTableRow } from '../../components/ui/SortableTableRow';
import type { Asset, Person } from '../../types/types';
import {
    DndContext,
    closestCenter,
} from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { useSortableList } from '../../hooks/useSortableList';

// Sortable Item Component
const SortableAssetCard = ({
    asset,
    ownerName,
    onEdit
}: {
    asset: Asset;
    ownerName?: string;
    onEdit: (id: string) => void;
}) => (
    <SortableCard id={asset.id} className="bg-white dark:bg-primary-900 border-primary-200 dark:border-primary-800">
        <div className="p-6 flex flex-col gap-2 flex-1">
            <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col gap-1">
                    <h3 className="text-lg font-semibold text-primary-900 dark:text-white pointer-events-none select-none">{asset.name}</h3>
                    {ownerName && <span className="text-xs text-primary-400 font-semibold uppercase tracking-wider">{ownerName}</span>}
                </div>
                {asset.type && <TypeBadge label={asset.type} />}
            </div>
            <p className="text-primary-500 dark:text-primary-400 text-sm line-clamp-3 mb-4 pointer-events-none select-none">{asset.description}</p>
            <div className="mt-auto pt-4 border-t border-primary-100 dark:border-primary-800 flex justify-end">
                <Button size="sm" variant="secondary" className="w-full" onClick={() => onEdit(asset.id)}>
                    <Edit size={14} /> Edit
                </Button>
            </div>
        </div>
    </SortableCard>
);

// Sortable List Item Component
const SortableAssetListItem = ({
    asset,
    ownerName,
    onEdit
}: {
    asset: Asset;
    ownerName?: string;
    onEdit: (id: string) => void;
}) => (
    <SortableTableRow id={asset.id}>
        <span className="w-48 shrink-0 font-medium text-sm text-primary-900 dark:text-white truncate select-none">{asset.name}</span>
        <span className="flex-1 min-w-0 text-sm text-primary-500 dark:text-primary-400 truncate hidden sm:block">{ownerName ?? ''}</span>
        {asset.type ? <TypeBadge label={asset.type} /> : <span className="w-0" />}
        <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); onEdit(asset.id); }} className="shrink-0 ml-auto">
            <Edit size={14} /> Edit
        </Button>
    </SortableTableRow>
);

export const AssetList: React.FC = () => {
    const { assets, reorderAssets, people } = useStore();
    const peopleById = Object.fromEntries((people as Person[]).map((p) => [p.id, p.name]));
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState<'expanded' | 'slim'>(
        () => (localStorage.getItem('kopfkino-view-assets') as 'expanded' | 'slim') || 'expanded'
    );

    useEffect(() => { localStorage.setItem('kopfkino-view-assets', viewMode); }, [viewMode]);

    const { sensors, handleDragEnd } = useSortableList(assets, reorderAssets);

    return (
        <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto">
            <PageHeader
                title="Assets"
                actions={<>
                    <ViewToggle value={viewMode} onChange={setViewMode} />
                    <Button onClick={() => navigate('new')} size="sm">
                        <Plus size={16} /> Add asset
                    </Button>
                </>}
            />

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                {assets.length === 0 ? (
                    <EmptyState icon={<Package size={48} />} message="No assets yet. Add your first one!" />
                ) : (
                    <SortableContext
                        items={assets.map(a => a.id)}
                        strategy={rectSortingStrategy}
                    >
                        {viewMode === 'expanded' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {assets.map((asset) => (
                                    <SortableAssetCard
                                        key={asset.id}
                                        asset={asset}
                                        ownerName={asset.ownerId ? peopleById[asset.ownerId] : undefined}
                                        onEdit={navigate}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="border border-primary-200 dark:border-primary-700 rounded-lg overflow-hidden">
                                {assets.map((asset) => (
                                    <SortableAssetListItem
                                        key={asset.id}
                                        asset={asset}
                                        ownerName={asset.ownerId ? peopleById[asset.ownerId] : undefined}
                                        onEdit={navigate}
                                    />
                                ))}
                            </div>
                        )}
                    </SortableContext>
                )}
            </DndContext>
        </div>
    );
};
