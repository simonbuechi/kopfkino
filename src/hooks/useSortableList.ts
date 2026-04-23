import { useCallback, useRef } from 'react';
import { arrayMove } from '@dnd-kit/sortable';
import type { DragEndEvent } from '@dnd-kit/core';
import { useDnDSensors } from './useDnDSensors';

export function useSortableList<T extends { id: string }>(
    items: T[],
    reorder: (newOrder: T[]) => void
) {
    const sensors = useDnDSensors();
    const itemsRef = useRef(items);
    const reorderRef = useRef(reorder);
    itemsRef.current = items;
    reorderRef.current = reorder;

    const handleDragEnd = useCallback((event: DragEndEvent) => {
        const { active, over } = event;
        if (active.id !== over?.id) {
            const current = itemsRef.current;
            const oldIndex = current.findIndex((item) => item.id === String(active.id));
            const newIndex = current.findIndex((item) => item.id === String(over?.id));
            reorderRef.current(arrayMove(current, oldIndex, newIndex));
        }
    }, []);

    return { sensors, handleDragEnd };
}
