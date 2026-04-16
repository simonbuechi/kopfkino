import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../hooks/useStore';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Users, Plus, Edit, Phone, Mail } from 'lucide-react';
import { ViewToggle } from '../../components/ui/ViewToggle';
import { DragHandle } from '../../components/ui/DragHandle';
import { EmptyState } from '../../components/ui/EmptyState';
import type { Person } from '../../types/types';
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
const SortablePersonCard = ({
    person,
    onEdit
}: {
    person: Person;
    onEdit: (id: string) => void;
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: person.id });

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

                <div className="p-6 flex flex-col gap-2 flex-1">
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-col gap-1">
                            <h3 className="text-lg font-semibold text-primary-900 dark:text-white pointer-events-none select-none">{person.name}</h3>
                            <span className="text-xs text-primary-400 font-medium uppercase tracking-wider">{person.role}</span>
                        </div>
                        {person.type && (
                            <span className="shrink-0 px-2 py-0.5 rounded text-xs font-bold bg-primary-200 dark:bg-primary-700 text-primary-700 dark:text-primary-300 pointer-events-none select-none">
                                {person.type}
                            </span>
                        )}
                    </div>
                    
                    <div className="flex flex-col gap-1 my-3">
                        {person.email && (
                            <div className="flex items-center gap-2 text-xs text-primary-500">
                                <Mail size={12} />
                                <span>{person.email}</span>
                            </div>
                        )}
                        {person.phone && (
                            <div className="flex items-center gap-2 text-xs text-primary-500">
                                <Phone size={12} />
                                <span>{person.phone}</span>
                            </div>
                        )}
                    </div>

                    <p className="text-primary-500 text-sm line-clamp-2 mb-4 pointer-events-none select-none italic">
                        {person.description}
                    </p>
                    
                    <div className="mt-auto pt-4 border-t border-primary-100 dark:border-primary-800 flex justify-end">
                        <Button
                            size="sm"
                            className="w-full"
                            onClick={() => onEdit(person.id)}
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
const SortablePersonListItem = ({
    person,
    onEdit
}: {
    person: Person;
    onEdit: (id: string) => void;
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: person.id });

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
                    onClick={() => onEdit(person.id)}
                    className="shrink-0 text-primary-500 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-100"
                >
                    <Edit size={14} /> Edit
                </Button>
                <div className="flex-1 min-w-0 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <h3 className="font-medium text-primary-900 dark:text-white truncate select-none">{person.name}</h3>
                        <span className="text-xs text-primary-400 hidden sm:inline-block">— {person.role}</span>
                        {person.type && (
                            <span className="shrink-0 px-2 py-0.5 rounded text-xs font-bold bg-primary-200 dark:bg-primary-700 text-primary-700 dark:text-primary-300 pointer-events-none select-none">
                                {person.type}
                            </span>
                        )}
                    </div>
                    <div className="hidden md:flex items-center gap-4 text-xs text-primary-400">
                        {person.email && <span>{person.email}</span>}
                        {person.phone && <span>{person.phone}</span>}
                    </div>
                </div>
            </Card>
        </div>
    );
};

export const PersonList: React.FC = () => {
    const { people, reorderPeople } = useStore();
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
            const oldIndex = people.findIndex((p) => p.id === active.id);
            const newIndex = people.findIndex((p) => p.id === over?.id);

            const newOrder = arrayMove(people, oldIndex, newIndex);
            reorderPeople(newOrder);
        }
    };

    return (
        <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-3xl font-bold text-primary-900 dark:text-white">People</h2>
                <div className="flex flex-wrap gap-2">
                    <ViewToggle value={viewMode} onChange={setViewMode} />
                    <Button onClick={() => navigate('new')} size="sm">
                        <Plus size={16} />
                        Add person
                    </Button>
                </div>
            </div>

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
                        <div className={
                            viewMode === 'expanded'
                                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                                : "flex flex-col gap-2"
                        }>
                            {people.map((person) => (
                                viewMode === 'expanded' ? (
                                    <SortablePersonCard
                                        key={person.id}
                                        person={person}
                                        onEdit={navigate}
                                    />
                                ) : (
                                    <SortablePersonListItem
                                        key={person.id}
                                        person={person}
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
