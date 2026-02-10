import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../../hooks/useStore';
import { Button } from '../../components/ui/Button';
import { ArrowLeft, Save, Trash2, User, Loader2, Upload, Sparkles, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import type { Character } from '../../types/types';
import { uploadFile, deleteImageFromUrl, uploadImageFromUrl } from '../../services/imageService';

export const CharacterDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { characters, addCharacter, deleteCharacter, settings } = useStore();
    const { user } = useAuth();

    const isNew = id === 'new';
    const existingCharacter = characters.find(c => c.id === id);

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [comment, setComment] = useState('');
    const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);

    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const fileInputRef = React.useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (existingCharacter) {
            setName(existingCharacter.name);
            setDescription(existingCharacter.description);
            setComment(existingCharacter.comment || '');
            setImageUrl(existingCharacter.imageUrl);
        }
    }, [existingCharacter]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && isFullscreen) {
                setIsFullscreen(false);
            }
        };

        if (isFullscreen) {
            window.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isFullscreen]);

    const handleSave = async () => {
        if (!name.trim()) return;
        setIsSaving(true);
        try {
            const characterData: Character = {
                id: isNew ? crypto.randomUUID() : id!,
                name,
                description,
                order: existingCharacter?.order,
            };

            if (comment) characterData.comment = comment;
            if (imageUrl) characterData.imageUrl = imageUrl;

            await addCharacter(characterData);
            navigate('/characters');
        } catch (error) {
            console.error("Failed to save character", error);
            alert("Failed to save character.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (confirm('Are you sure you want to delete this character?')) {
            await deleteCharacter(id!);
            navigate('/characters');
        }
    };

    const onFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !user) return;

        setIsUploading(true);
        try {
            const url = await uploadFile(file, user.uid);
            setImageUrl(url);
        } catch (error: any) {
            console.error("Failed to upload image", error);
            alert(`Failed to upload image: ${error.message || 'Unknown error'}`);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };


    const handleRemoveImage = async () => {
        if (!imageUrl) return;
        if (confirm('Remove this image?')) {
            // If we really want to be clean, we should delete from storage.
            // But for now just unlinking is safer if we share images (though we don't here).
            // Let's try to delete if it looks like a firebase storage url.
            if (imageUrl.includes('firebasestorage')) {
                await deleteImageFromUrl(imageUrl);
            }
            setImageUrl(undefined);
        }
    };


    if (!isNew && !existingCharacter) {
        return <div className="p-8">Character not found</div>;
    }

    return (
        <div className="flex flex-col gap-8 w-full max-w-3xl mx-auto">
            <div>
                <Button variant="ghost" onClick={() => navigate('/characters')} size="sm" className="-ml-3 text-zinc-500">
                    <ArrowLeft size={16} /> Back to Characters
                </Button>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start gap-4 pb-6 border-b border-zinc-200 dark:border-zinc-800">
                <h1 className="text-4xl font-bold text-zinc-900 dark:text-white">{isNew ? 'New Character' : name}</h1>
                <div className="flex gap-2">
                    {!isNew && (
                        <Button variant="danger" onClick={handleDelete} size="sm">
                            <Trash2 size={16} /> Delete
                        </Button>
                    )}
                    <Button onClick={handleSave} disabled={isSaving || !name} size="sm">
                        {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                        Save Character
                    </Button>
                </div>
            </div>

            <div className="grid gap-8">
                {/* Image Section */}
                <div className="flex flex-col md:flex-row gap-8 items-start">
                    <div className="w-full md:w-1/3 flex flex-col gap-4">
                        <div className="aspect-[3/4] bg-zinc-100 dark:bg-zinc-800 rounded-xl overflow-hidden relative group flex items-center justify-center border border-zinc-200 dark:border-zinc-700">
                            {imageUrl ? (
                                <>
                                    <img
                                        src={imageUrl}
                                        alt={name}
                                        className="w-full h-full object-cover cursor-pointer hover:opacity-95 transition-opacity"
                                        onClick={() => setIsFullscreen(true)}
                                    />
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleRemoveImage(); }}
                                        className="absolute top-2 right-2 bg-black/60 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
                                    >
                                        <X size={14} />
                                    </button>
                                </>
                            ) : (
                                <User size={48} className="text-zinc-300 dark:text-zinc-600" />
                            )}
                        </div>

                        <div className="flex flex-col gap-2">
                            <input type="file" ref={fileInputRef} onChange={onFileSelected} className="hidden" accept="image/*" />
                            <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                                {isUploading ? <Loader2 className="animate-spin" size={14} /> : <Upload size={14} />}
                                Upload Image
                            </Button>
                        </div>
                    </div>

                    <div className="w-full md:w-2/3 flex flex-col gap-6">
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium text-zinc-900 dark:text-zinc-300">Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full p-3 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                                placeholder="Character Name"
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium text-zinc-900 dark:text-zinc-300">Description</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full p-3 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all min-h-[120px]"
                                placeholder="Physical appearance, personality, role..."
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium text-zinc-900 dark:text-zinc-300">Notes / Comments</label>
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                className="w-full p-3 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all min-h-[80px]"
                                placeholder="Internal notes, casting ideas..."
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Fullscreen Image Overlay */}
            {isFullscreen && imageUrl && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
                    onClick={() => setIsFullscreen(false)}
                >
                    <button
                        className="absolute top-4 right-4 text-white hover:text-zinc-300 transition-colors bg-black/50 rounded-full p-2"
                        onClick={() => setIsFullscreen(false)}
                    >
                        <X size={24} />
                    </button>
                    <img
                        src={imageUrl}
                        alt={name}
                        className="max-w-full max-h-full object-contain shadow-2xl rounded-lg"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    );
};
