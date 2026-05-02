import React, { useRef } from 'react';
import { Edit, Trash2, Image as ImageIcon, Loader2, GripVertical, Video, Volume2 } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import toast from 'react-hot-toast';
import type { Shot } from '../../types/types';

export interface SortableShotItemProps {
    shot: Shot;
    onUploadImage: (shot: Shot, file: File) => void;
    onUploadVideo: (shot: Shot, file: File) => void;
    onDelete: (id: string) => void;
    onRemoveVideo: (shot: Shot) => void;
    onEdit: (id: string) => void;
    isUploading: boolean;
    viewMode: 'preview' | 'slim' | 'detailed';
    onImageClick: (url: string, alt: string) => void;
    isDragOverlay?: boolean;
}

export const SortableShotItem: React.FC<SortableShotItemProps> = ({
    shot,
    onUploadImage,
    onUploadVideo,
    onDelete,
    onRemoveVideo,
    onEdit,
    isUploading,
    viewMode,
    onImageClick,
    isDragOverlay,
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: shot.id });

    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);

    const style = isDragOverlay ? {} : {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
        opacity: isDragging ? 0.35 : 1,
        position: 'relative' as const,
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) onUploadImage(shot, file);
    };

    const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 10 * 1024 * 1024) {
                toast.error('Video file size must be less than 10MB.');
                return;
            }
            onUploadVideo(shot, file);
        }
    };

    const displayImage = shot.imageUrl || shot.visualizationUrl;
    const dragHandleProps = isDragOverlay ? {} : { ...attributes, ...listeners };

    if (viewMode === 'slim') {
        return (
            <div ref={isDragOverlay ? undefined : setNodeRef} style={style}
                className="flex flex-col bg-white dark:bg-primary-900 border border-primary-200 dark:border-primary-800 rounded-lg group overflow-hidden">
                <div className="flex items-center gap-3 p-3">
                    <div {...dragHandleProps}
                        className="text-primary-400 hover:text-primary-600 dark:hover:text-primary-300 cursor-grab active:cursor-grabbing p-1">
                        <GripVertical size={16} />
                    </div>
                    <div className="font-medium text-primary-900 dark:text-primary-100 flex-1 truncate select-none flex items-center gap-2">
                        {shot.name}
                        {(shot.length && shot.length > 0) ? (
                            <span className="text-xs text-primary-400 font-semibold">({shot.length}s)</span>
                        ) : null}
                        {shot.audio && <Volume2 size={12} className="text-primary-400" />}
                    </div>
                    <div className="flex gap-1">
                        <button type="button"
                            onClick={() => displayImage && onImageClick(displayImage, shot.name)}
                            disabled={!displayImage}
                            className="flex items-center justify-center h-8 w-8 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-30 text-primary-400 hover:text-primary-900 hover:bg-primary-100 dark:text-primary-500 dark:hover:text-primary-100 dark:hover:bg-primary-800"
                            title={displayImage ? "View Full Image" : "No Image"}>
                            <ImageIcon size={14} />
                        </button>
                        <button type="button" onClick={() => onEdit(shot.id)}
                            className="flex items-center justify-center h-8 w-8 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 text-primary-400 hover:text-primary-900 hover:bg-primary-100 dark:text-primary-500 dark:hover:text-primary-100 dark:hover:bg-primary-800"
                            title="Edit Shot">
                            <Edit size={14} />
                        </button>
                        <button type="button" onClick={() => onDelete(shot.id)}
                            className="flex items-center justify-center h-8 w-8 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 text-primary-400 hover:text-danger-600 hover:bg-danger-50 dark:text-primary-500 dark:hover:text-danger-400 dark:hover:bg-danger-900/20"
                            title="Delete Shot">
                            <Trash2 size={14} />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (viewMode === 'detailed') {
        return (
            <div ref={isDragOverlay ? undefined : setNodeRef} style={style}
                className="flex bg-white dark:bg-primary-900 border border-primary-200 dark:border-primary-800 rounded-lg group overflow-hidden items-stretch">
                <div {...dragHandleProps}
                    className="flex flex-col items-center justify-center bg-primary-50 dark:bg-primary-800/50 border-r border-primary-200 dark:border-primary-800 text-primary-400 hover:text-primary-600 dark:hover:text-primary-300 cursor-grab active:cursor-grabbing px-2">
                    <GripVertical size={16} />
                </div>
                <div
                    className="relative w-32 shrink-0 bg-primary-100 dark:bg-primary-800 cursor-pointer overflow-hidden group/image border-r border-primary-200 dark:border-primary-800"
                    onClick={() => displayImage && onImageClick(displayImage, shot.name)}>
                    {shot.videoUrl ? (
                        <video src={shot.videoUrl} className="w-full h-full object-cover" onClick={e => e.stopPropagation()} />
                    ) : displayImage ? (
                        <img src={displayImage} alt={shot.description} className="w-full h-full object-cover transition-transform duration-500 group-hover/image:scale-105" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-primary-300 dark:text-primary-700">
                            <ImageIcon size={24} />
                        </div>
                    )}
                </div>
                <div className="flex-1 p-4 flex flex-col gap-2 min-w-0">
                    <div className="flex justify-between items-start gap-4">
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-primary-900 dark:text-white leading-tight truncate" title={shot.name}>{shot.name}</h3>
                            {(shot.length && shot.length > 0) ? (
                                <span className="text-xs px-1.5 py-0.5 rounded bg-primary-100 dark:bg-primary-800 text-primary-500 font-semibold">{shot.length}s</span>
                            ) : null}
                            {shot.audio && <span className="text-primary-400" title="Has Audio"><Volume2 size={14} /></span>}
                        </div>
                        <div className="flex gap-1 shrink-0">
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                            <button type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                                className="flex items-center justify-center h-8 w-8 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 text-primary-500 hover:text-primary-900 hover:bg-primary-100 dark:text-primary-400 dark:hover:text-primary-100 dark:hover:bg-primary-800 disabled:opacity-50"
                                title="Upload Image">
                                {isUploading ? <Loader2 className="animate-spin" size={14} /> : <ImageIcon size={14} />}
                            </button>
                            <input type="file" ref={videoInputRef} className="hidden" accept="video/mp4,video/webm" onChange={handleVideoChange} />
                            <button type="button"
                                onClick={() => shot.videoUrl ? onRemoveVideo(shot) : videoInputRef.current?.click()}
                                disabled={isUploading}
                                className={`flex items-center justify-center h-8 w-8 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 hover:bg-primary-100 dark:hover:bg-primary-800 disabled:opacity-50 ${shot.videoUrl ? 'text-danger-500 hover:text-danger-600 dark:text-danger-400 dark:hover:text-danger-300' : 'text-primary-500 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-100'}`}
                                title={shot.videoUrl ? "Delete Video" : "Upload Video"}>
                                {isUploading ? <Loader2 className="animate-spin" size={14} /> : (shot.videoUrl ? <Trash2 size={14} /> : <Video size={14} />)}
                            </button>
                            <button type="button" onClick={() => onEdit(shot.id)}
                                className="flex items-center justify-center h-8 w-8 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 text-primary-500 hover:text-primary-900 hover:bg-primary-100 dark:text-primary-400 dark:hover:text-primary-100 dark:hover:bg-primary-800"
                                title="Edit Shot">
                                <Edit size={14} />
                            </button>
                            <button type="button" onClick={() => onDelete(shot.id)}
                                className="flex items-center justify-center h-8 w-8 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 text-primary-500 hover:text-danger-600 hover:bg-danger-50 dark:text-primary-400 dark:hover:text-danger-400 dark:hover:bg-danger-900/20"
                                title="Delete Shot">
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                        {shot.description && (
                            <div>
                                <h4 className="text-xs font-semibold text-primary-900 dark:text-white mb-1 uppercase tracking-wider">Description</h4>
                                <p className="text-sm text-primary-600 dark:text-primary-300">{shot.description}</p>
                            </div>
                        )}
                        {shot.notes && (
                            <div>
                                <h4 className="text-xs font-semibold text-primary-900 dark:text-white mb-1 uppercase tracking-wider">Notes</h4>
                                <p className="text-sm text-primary-500 dark:text-primary-400">{shot.notes}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // preview mode
    return (
        <div ref={isDragOverlay ? undefined : setNodeRef} style={style}>
            <Card className="flex flex-col !p-0 overflow-hidden group/card bg-white dark:bg-primary-900 border-primary-200 dark:border-primary-800">
                <div
                    className="relative w-full aspect-video bg-primary-100 dark:bg-primary-800 cursor-pointer overflow-hidden group/image"
                    onClick={() => displayImage && onImageClick(displayImage, shot.name)}>
                    {shot.videoUrl ? (
                        <video src={shot.videoUrl} className="w-full h-full object-cover" controls onClick={e => e.stopPropagation()} />
                    ) : displayImage ? (
                        <img src={displayImage} alt={shot.description} className="w-full h-full object-cover transition-transform duration-500 group-hover/image:scale-105" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-primary-300 dark:text-primary-700">
                            <ImageIcon size={32} />
                        </div>
                    )}
                    <div {...dragHandleProps}
                        className="absolute top-2 left-2 z-10 text-white bg-black/50 hover:bg-black/70 p-1 rounded cursor-grab active:cursor-grabbing transition-colors">
                        <GripVertical size={16} />
                    </div>
                </div>
                <div className="p-3 flex flex-col gap-1">
                    <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0 flex-1 flex flex-col">
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-primary-900 dark:text-white leading-tight truncate" title={shot.name}>{shot.name}</h3>
                                {(shot.length && shot.length > 0) ? (
                                    <span className="text-xs px-1.5 py-0.5 rounded bg-primary-100 dark:bg-primary-800 text-primary-500 font-semibold">{shot.length}s</span>
                                ) : null}
                                {shot.audio && <span className="text-primary-400" title="Has Audio"><Volume2 size={14} /></span>}
                            </div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                            <button type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                                className="flex items-center justify-center h-6 w-6 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 text-primary-500 hover:text-primary-900 hover:bg-primary-100 dark:text-primary-400 dark:hover:text-primary-100 dark:hover:bg-primary-800 disabled:opacity-50"
                                title="Upload Image">
                                {isUploading ? <Loader2 className="animate-spin" size={14} /> : <ImageIcon size={14} />}
                            </button>
                            <input type="file" ref={videoInputRef} className="hidden" accept="video/mp4,video/webm" onChange={handleVideoChange} />
                            <button type="button"
                                onClick={() => shot.videoUrl ? onRemoveVideo(shot) : videoInputRef.current?.click()}
                                disabled={isUploading}
                                className={`flex items-center justify-center h-6 w-6 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 hover:bg-primary-100 dark:hover:bg-primary-800 disabled:opacity-50 ${shot.videoUrl ? 'text-danger-500 hover:text-danger-600 dark:text-danger-400 dark:hover:text-danger-300' : 'text-primary-500 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-100'}`}
                                title={shot.videoUrl ? "Delete Video" : "Upload Video"}>
                                {isUploading ? <Loader2 className="animate-spin" size={14} /> : (shot.videoUrl ? <Trash2 size={14} /> : <Video size={14} />)}
                            </button>
                            <button type="button" onClick={() => onEdit(shot.id)}
                                className="flex items-center justify-center h-6 w-6 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 text-primary-500 hover:text-primary-900 hover:bg-primary-100 dark:text-primary-400 dark:hover:text-primary-100 dark:hover:bg-primary-800"
                                title="Edit Shot">
                                <Edit size={14} />
                            </button>
                            <button type="button" onClick={() => onDelete(shot.id)}
                                className="flex items-center justify-center h-6 w-6 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 text-primary-500 hover:text-danger-600 hover:bg-danger-50 dark:text-primary-400 dark:hover:text-danger-400 dark:hover:bg-danger-900/20"
                                title="Delete Shot">
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>
                    <p className="text-xs text-primary-500 line-clamp-2">{shot.description}</p>
                    {shot.notes && <p className="text-xs text-primary-400 mt-1 line-clamp-2">{shot.notes}</p>}
                </div>
            </Card>
        </div>
    );
};
