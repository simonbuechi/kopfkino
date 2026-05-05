import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../hooks/useStore';
import { Button } from '../../components/ui/Button';
import { Users, Plus, Edit, Phone, Mail } from 'lucide-react';
import { ViewToggle } from '../../components/ui/ViewToggle';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageHeader } from '../../components/ui/PageHeader';
import { TypeBadge } from '../../components/ui/TypeBadge';
import { SortableCard } from '../../components/ui/SortableCard';
import { SortableTableRow } from '../../components/ui/SortableTableRow';
import type { Person } from '../../types/types';
import {
    DndContext,
    closestCenter,
} from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { useSortableList } from '../../hooks/useSortableList';

// Sortable Item Component
const SortablePersonCard = ({
    person,
    onEdit
}: {
    person: Person;
    onEdit: (id: string) => void;
}) => (
    <SortableCard id={person.id} className="bg-white dark:bg-primary-900 border-primary-200 dark:border-primary-800">
        <div className="p-6 flex flex-col gap-2 flex-1">
            <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col gap-1">
                    <h3 className="text-lg font-semibold text-primary-900 dark:text-white pointer-events-none select-none">{person.name}</h3>
                    <span className="text-xs text-primary-400 font-semibold uppercase tracking-wider">{person.role}</span>
                </div>
                {person.type && <TypeBadge label={person.type} />}
            </div>
            <div className="flex flex-col gap-1 my-3">
                {person.email && (
                    <div className="flex items-center gap-2 text-xs text-primary-500">
                        <Mail size={12} /><span>{person.email}</span>
                    </div>
                )}
                {person.phone && (
                    <div className="flex items-center gap-2 text-xs text-primary-500">
                        <Phone size={12} /><span>{person.phone}</span>
                    </div>
                )}
            </div>
            <p className="text-primary-500 dark:text-primary-400 text-sm line-clamp-2 mb-4 pointer-events-none select-none">{person.description}</p>
            <div className="mt-auto pt-4 border-t border-primary-100 dark:border-primary-800 flex justify-end">
                <Button size="sm" className="w-full" variant="secondary" onClick={() => onEdit(person.id)}>
                    <Edit size={14} /> Edit
                </Button>
            </div>
        </div>
    </SortableCard>
);

// Sortable List Item Component
const SortablePersonListItem = ({
    person,
    onEdit
}: {
    person: Person;
    onEdit: (id: string) => void;
}) => (
    <SortableTableRow id={person.id}>
        <span className="w-40 shrink-0 font-medium text-sm text-primary-900 dark:text-white truncate select-none">{person.name}</span>
        <span className="w-32 shrink-0 text-sm text-primary-500 dark:text-primary-400 truncate hidden sm:block">{person.role}</span>
        <div className="flex-1 min-w-0 hidden md:flex items-center gap-6 text-sm text-primary-400">
            {person.email && <span className="flex items-center gap-1 truncate"><Mail size={12} className="shrink-0" />{person.email}</span>}
            {person.phone && <span className="flex items-center gap-1 truncate"><Phone size={12} className="shrink-0" />{person.phone}</span>}
        </div>
        {person.type ? <TypeBadge label={person.type} /> : <span className="w-0" />}
        <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); onEdit(person.id); }} className="shrink-0 ml-auto">
            <Edit size={14} /> Edit
        </Button>
    </SortableTableRow>
);

export const PersonList: React.FC = () => {
    const { people, reorderPeople } = useStore();
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState<'expanded' | 'slim'>(
        () => (localStorage.getItem('kopfkino-view-people') as 'expanded' | 'slim') || 'expanded'
    );

    useEffect(() => { localStorage.setItem('kopfkino-view-people', viewMode); }, [viewMode]);

    const { sensors, handleDragEnd } = useSortableList(people, reorderPeople);

    return (
        <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto">
            <PageHeader
                title="People"
                actions={<>
                    <ViewToggle value={viewMode} onChange={setViewMode} />
                    <Button onClick={() => navigate('new')} size="sm">
                        <Plus size={16} /> Add person
                    </Button>
                </>}
            />

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                {people.length === 0 ? (
                    <EmptyState icon={<Users size={48} />} message="No people added yet. Add your first cast or crew member!" />
                ) : (
                    <SortableContext
                        items={people.map(p => p.id)}
                        strategy={rectSortingStrategy}
                    >
                        {viewMode === 'expanded' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {people.map((person) => (
                                    <SortablePersonCard key={person.id} person={person} onEdit={navigate} />
                                ))}
                            </div>
                        ) : (
                            <div className="border border-primary-200 dark:border-primary-700 rounded-lg overflow-hidden">
                                {people.map((person) => (
                                    <SortablePersonListItem key={person.id} person={person} onEdit={navigate} />
                                ))}
                            </div>
                        )}
                    </SortableContext>
                )}
            </DndContext>
        </div>
    );
};
