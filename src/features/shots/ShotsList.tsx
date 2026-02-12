
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../hooks/useStore';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Edit, Trash2, Plus, Image as ImageIcon, Loader2, GripVertical, Upload } from 'lucide-react';
import { uploadFile } from '../../services/imageService';
import type { Shot } from '../../types/types';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ShotsListProps {
    sceneId: string;
    shots: Shot[];
}

const SortableShotItem = ({
    shot,
    onUpload,
    onDelete,
    onEdit,
    isUploading
}: {
    shot: Shot;
    onUpload: (shot: Shot, file: File) => void;
    onDelete: (id: string) => void;
    onEdit: (id: string) => void;
    isUploading: boolean;
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: shot.id });
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
        opacity: isDragging ? 0.5 : 1,
        position: 'relative' as const,
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onUpload(shot, file);
        }
    };

    // Prioritize imageUrl over visualizationUrl
    const displayImage = shot.imageUrl || shot.visualizationUrl;

    return (
        <div ref={setNodeRef} style={style}>
            <Card className="flex flex-col p-0 overflow-hidden group/card relative min-h-[160px]">
                {/* Background Image / Visualization */}
                <div className="absolute inset-0 z-0 bg-zinc-100 dark:bg-zinc-800">
                    {displayImage ? (
                        <img src={displayImage} alt={shot.description} className="w-full h-full object-cover opacity-100 group-hover/card:scale-105 transition-transform duration-500" />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-6 text-zinc-400 gap-2 opacity-50">
                            <ImageIcon size={32} />
                        </div>
                    )}
                    {/* Gradient Overlay for Text Readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />
                </div>

                {/* Drag Handle */}
                <div
                    {...attributes}
                    {...listeners}
                    className="absolute top-3 left-3 z-20 text-white/70 hover:text-white cursor-grab active:cursor-grabbing p-1 bg-black/20 hover:bg-black/40 rounded backdrop-blur-sm transition-all"
                >
                    <GripVertical size={20} />
                </div>

                {/* Content Overlay */}
                <div className="relative z-10 p-5 flex flex-col h-full justify-end text-white">
                    <div className="flex justify-between items-end gap-4">
                        <div className="flex-1 space-y-1">
                            <h3 className="text-xl font-bold leading-tight shadow-black drop-shadow-md">{shot.name}</h3>
                            <p className="text-sm text-zinc-200 line-clamp-2 shadow-black drop-shadow-sm opacity-90">{shot.description}</p>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-2 shrink-0">
                            <div className="flex gap-2">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                />
                                <Button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="backdrop-blur-md bg-white/20 hover:bg-white/30 text-white border-none shadow-lg"
                                    disabled={isUploading}
                                >
                                    {isUploading ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
                                </Button>
                                <Button onClick={() => onEdit(shot.id)} className="backdrop-blur-md bg-white/20 hover:bg-white/30 text-white border-none shadow-lg">
                                    <Edit size={16} />
                                </Button>
                                <Button variant="danger" className="backdrop-blur-md bg-red-500/20 hover:bg-red-600/40 text-red-200 border-none shadow-lg" onClick={() => onDelete(shot.id)}>
                                    <Trash2 size={16} />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export const ShotsList: React.FC<ShotsListProps> = ({ sceneId, shots }) => {
    const { deleteShotFromScene, updateShotInScene, reorderShotsInScene } = useStore();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [uploadingId, setUploadingId] = useState<string | null>(null);

    // const scene = scenes.find(s => s.id === sceneId);
    // Location and Scene are not needed for upload, but maybe for drag/drop context? 
    // Actually sceneId is passed. 

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDelete = (id: string) => {
        if (confirm('Delete this shot?')) {
            deleteShotFromScene(sceneId, id);
        }
    };

    const handleUpload = async (shot: Shot, file: File) => {
        if (!user) return;
        setUploadingId(shot.id);
        try {
            const url = await uploadFile(file, user.uid);
            await updateShotInScene(sceneId, { ...shot, imageUrl: url });
        } catch (error) {
            console.error("Upload failed", error);
            alert("Failed to upload image.");
        } finally {
            setUploadingId(null);
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            const oldIndex = shots.findIndex((s) => s.id === active.id);
            const newIndex = shots.findIndex((s) => s.id === over?.id);

            const newOrder = arrayMove(shots, oldIndex, newIndex);
            reorderShotsInScene(sceneId, newOrder);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Shots List</h3>
                <Button size="sm" onClick={() => navigate(`shots/new`)}>
                    <Plus size={16} /> Add Shot
                </Button>
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <div className="flex flex-col gap-6">
                    {shots.length === 0 ? (
                        <p className="text-zinc-500 italic">No shots yet.</p>
                    ) : (
                        <SortableContext
                            items={shots.map(s => s.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            {shots.map((shot) => (
                                <SortableShotItem
                                    key={shot.id}
                                    shot={shot}
                                    onUpload={handleUpload}
                                    onDelete={handleDelete}
                                    onEdit={(id) => navigate(`shots/${id}/edit`)}
                                    isUploading={uploadingId === shot.id}
                                />
                            ))}
                        </SortableContext >
                    )}
                </div >
            </DndContext >
        </div >
    );
};

