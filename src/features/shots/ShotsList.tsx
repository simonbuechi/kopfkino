import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../hooks/useStore';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Edit, Trash2, Plus, Image as ImageIcon, Loader2, GripVertical, List, Grid, Download, Timer, Film, Volume2 } from 'lucide-react';

import { uploadFile, uploadVideo, downloadImage, deleteFileFromUrl } from '../../services/storageService';
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
    onUploadImage,
    onUploadVideo,
    onDelete,
    onRemoveVideo,
    onEdit,
    isUploading,
    viewMode,
    onImageClick
}: {
    shot: Shot;
    onUploadImage: (shot: Shot, file: File) => void;
    onUploadVideo: (shot: Shot, file: File) => void;
    onDelete: (id: string) => void;
    onRemoveVideo: (shot: Shot) => void;
    onEdit: (id: string) => void;
    isUploading: boolean;
    viewMode: 'expanded' | 'slim';
    onImageClick: (url: string, alt: string) => void;
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
    const videoInputRef = React.useRef<HTMLInputElement>(null);

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
            onUploadImage(shot, file);
        }
    };

    const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Check file size (10MB limit)
            if (file.size > 10 * 1024 * 1024) {
                alert("Video file size must be less than 10MB.");
                return;
            }
            onUploadVideo(shot, file);
        }
    };

    // Prioritize imageUrl over visualizationUrl
    const displayImage = shot.imageUrl || shot.visualizationUrl;

    if (viewMode === 'slim') {
        return (
            <div ref={setNodeRef} style={style} className="flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg group overflow-hidden">
                <div className="flex items-center gap-3 p-3">
                    {/* Drag Handle */}
                    <div
                        {...attributes}
                        {...listeners}
                        className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 cursor-grab active:cursor-grabbing p-1"
                    >
                        <GripVertical size={16} />
                    </div>

                    <div className="font-medium text-zinc-900 dark:text-zinc-100 flex-1 truncate select-none flex items-center gap-2">
                        {shot.name}
                        {(shot.length && shot.length > 0) ? (
                            <span className="text-xs text-zinc-400 font-normal">({shot.length}s)</span>
                        ) : null}
                        {shot.audio && <Volume2 size={12} className="text-zinc-400" />}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1">
                        <button
                            type="button"
                            onClick={() => displayImage && onImageClick(displayImage, shot.name)}
                            disabled={!displayImage}
                            className="flex items-center justify-center h-8 w-8 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-500 disabled:opacity-30 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-500 dark:hover:text-zinc-100 dark:hover:bg-zinc-800"
                            title={displayImage ? "View Full Image" : "No Image"}
                        >
                            <ImageIcon size={14} />
                        </button>
                        <button
                            type="button"
                            onClick={() => onEdit(shot.id)}
                            className="flex items-center justify-center h-8 w-8 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-500 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-500 dark:hover:text-zinc-100 dark:hover:bg-zinc-800"
                            title="Edit Shot"
                        >
                            <Edit size={14} />
                        </button>
                        <button
                            type="button"
                            onClick={() => onDelete(shot.id)}
                            className="flex items-center justify-center h-8 w-8 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-500 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:text-zinc-500 dark:hover:text-red-400 dark:hover:bg-red-900/20"
                            title="Delete Shot"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div ref={setNodeRef} style={style}>
            <Card className="flex flex-col !p-0 overflow-hidden group/card bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                {/* Image Section */}
                <div
                    className="relative w-full aspect-video bg-zinc-100 dark:bg-zinc-800 cursor-pointer overflow-hidden group/image"
                    onClick={() => displayImage && onImageClick(displayImage, shot.name)}
                    title={shot.videoUrl ? "Contains Video" : "View Full Image"}
                >
                    {shot.videoUrl ? (
                        <video
                            src={shot.videoUrl}
                            className="w-full h-full object-cover"
                            controls
                            onClick={(e) => e.stopPropagation()}
                        />
                    ) : displayImage ? (
                        <img
                            src={displayImage}
                            alt={shot.description}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover/image:scale-105"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-300 dark:text-zinc-700">
                            <ImageIcon size={32} />
                        </div>
                    )}

                    {/* Drag Handle - Overlay on top left of image */}
                    <div
                        {...attributes}
                        {...listeners}
                        className="absolute top-2 left-2 z-10 text-white bg-black/50 hover:bg-black/70 p-1 rounded cursor-grab active:cursor-grabbing transition-colors"
                    >
                        <GripVertical size={16} />
                    </div>
                </div>

                {/* Content Section */}
                <div className="p-3 flex flex-col gap-1">
                    <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0 flex-1 flex flex-col">
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-zinc-900 dark:text-white leading-tight truncate" title={shot.name}>{shot.name}</h3>
                                {(shot.length && shot.length > 0) ? (
                                    <span className="text-xs px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-medium">
                                        {shot.length}s
                                    </span>
                                ) : null}
                                {shot.audio && (
                                    <span className="text-zinc-400" title="Has Audio">
                                        <Volume2 size={14} />
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-1 shrink-0">
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileChange}
                            />
                            <button
                                type="button"
                                className="flex items-center justify-center h-6 w-6 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-500 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50"
                                title="Upload Image"
                            >
                                {isUploading ? <Loader2 className="animate-spin" size={14} /> : <ImageIcon size={14} />}
                            </button>

                            <input
                                type="file"
                                ref={videoInputRef}
                                className="hidden"
                                accept="video/mp4,video/webm"
                                onChange={handleVideoChange}
                            />
                            <button
                                type="button"
                                onClick={() => {
                                    if (shot.videoUrl) {
                                        if (confirm("Delete video?")) {
                                            onRemoveVideo(shot);
                                        }
                                    } else {
                                        videoInputRef.current?.click();
                                    }
                                }}
                                disabled={isUploading}
                                className={`flex items-center justify-center h-6 w-6 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50 ${shot.videoUrl
                                    ? 'text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300'
                                    : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
                                    }`}
                                title={shot.videoUrl ? "Delete Video" : "Upload Video"}
                            >
                                {isUploading ? <Loader2 className="animate-spin" size={14} /> : (shot.videoUrl ? <Trash2 size={14} /> : <Film size={14} />)}
                            </button>
                            <button
                                type="button"
                                onClick={() => onEdit(shot.id)}
                                className="flex items-center justify-center h-6 w-6 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-500 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800"
                                title="Edit Shot"
                            >
                                <Edit size={14} />
                            </button>
                            <button
                                type="button"
                                onClick={() => onDelete(shot.id)}
                                className="flex items-center justify-center h-6 w-6 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-500 text-zinc-500 hover:text-red-600 hover:bg-red-50 dark:text-zinc-400 dark:hover:text-red-400 dark:hover:bg-red-900/20"
                                title="Delete Shot"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>
                    <p className="text-xs text-zinc-500 line-clamp-2">{shot.description}</p>
                </div>
            </Card >
        </div >
    );
};

export const ShotsList: React.FC<ShotsListProps> = ({ sceneId, shots }) => {
    const { deleteShotFromScene, updateShotInScene, reorderShotsInScene } = useStore();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [uploadingId, setUploadingId] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'expanded' | 'slim'>('expanded');

    const [imageModal, setImageModal] = useState<{ url: string; alt: string } | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Close modal on ESC key
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setImageModal(null);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleDelete = (id: string) => {
        if (confirm('Delete this shot?')) {
            deleteShotFromScene(sceneId, id);
        }
    };

    const handleUploadImage = async (shot: Shot, file: File) => {
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

    const handleUploadVideo = async (shot: Shot, file: File) => {
        if (!user) return;
        setUploadingId(shot.id);
        try {
            const url = await uploadVideo(file, user.uid);
            await updateShotInScene(sceneId, { ...shot, videoUrl: url });
        } catch (error) {
            console.error("Video upload failed", error);
            alert("Failed to upload video.");
        } finally {
            setUploadingId(null);
        }
    };

    const handleRemoveVideo = async (shot: Shot) => {
        if (!shot.videoUrl) return;

        // Optimistic update: remove from UI first (or wait? let's wait to be safe)
        try {
            await deleteFileFromUrl(shot.videoUrl);
            await updateShotInScene(sceneId, { ...shot, videoUrl: undefined });
        } catch (error) {
            console.error("Failed to delete video", error);
            alert("Failed to delete video.");
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
        <div className="space-y-6 relative">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                        <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Shots List</h3>
                        <div className="flex items-center gap-2">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-300 border border-amber-100 dark:border-amber-800">
                                <Film size={12} />
                                {shots.length}
                            </div>
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800">
                                <Timer size={12} />
                                {(() => {
                                    const totalSeconds = shots.reduce((acc, shot) => acc + (shot.length || 0), 0);
                                    const minutes = Math.floor(totalSeconds / 60);
                                    const seconds = totalSeconds % 60;
                                    if (minutes > 0) {
                                        return `${minutes}m ${seconds}s`;
                                    }
                                    return `${seconds}s`;
                                })()}
                            </div>
                        </div>
                    </div>
                    <div className="bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg flex gap-1">
                        <button
                            onClick={() => setViewMode('expanded')}
                            className={`p-1.5 rounded-md transition-all ${viewMode === 'expanded'
                                ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm'
                                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                                }`}
                            title="Expanded View"
                        >
                            <Grid size={14} />
                        </button>
                        <button
                            onClick={() => setViewMode('slim')}
                            className={`p-1.5 rounded-md transition-all ${viewMode === 'slim'
                                ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm'
                                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                                }`}
                            title="Slim View"
                        >
                            <List size={14} />
                        </button>
                    </div>
                </div>
                <Button size="sm" onClick={() => navigate(`shots/new`)}>
                    <Plus size={16} /> Add Shot
                </Button>
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <div className={`flex flex-col gap-${viewMode === 'expanded' ? '6' : '3'}`}>
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
                                    onUploadImage={handleUploadImage}
                                    onUploadVideo={handleUploadVideo}
                                    onDelete={handleDelete}
                                    onRemoveVideo={handleRemoveVideo}
                                    onEdit={(id) => navigate(`shots/${id}/edit`)}
                                    isUploading={uploadingId === shot.id}
                                    viewMode={viewMode}
                                    onImageClick={(url, alt) => setImageModal({ url, alt })}
                                />
                            ))}
                        </SortableContext >
                    )}
                </div >
            </DndContext >

            {/* Full Screen Image Modal */}
            {imageModal && (
                <div
                    className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm"
                    onClick={() => setImageModal(null)}
                >
                    <div className="absolute top-4 right-4 flex gap-2">
                        <button
                            className="text-white hover:text-zinc-300 p-2 bg-black/50 rounded-full transition-colors"
                            onClick={(e) => {
                                e.stopPropagation();
                                downloadImage(imageModal.url, `shot-${new Date().getTime()}.png`);
                            }}
                            title="Download Image"
                        >
                            <Download size={24} />
                        </button>
                        <button
                            className="text-white hover:text-zinc-300 p-2 bg-black/50 rounded-full transition-colors"
                            onClick={() => setImageModal(null)}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                        </button>
                    </div>
                    <img
                        src={imageModal.url}
                        alt={imageModal.alt}
                        className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl pointer-events-auto"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}

        </div >
    );
};

