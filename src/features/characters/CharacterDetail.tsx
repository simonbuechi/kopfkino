import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../../hooks/useStore';
import { useProjects } from '../../context/ProjectContext';
import { Button } from '../../components/ui/Button';
import { ArrowLeft, Save, Trash2, User, Loader2, Upload, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import type { Character, CharacterType } from '../../types/types';
import { useDebounce } from '../../hooks/useDebounce';
import { uploadFile, deleteImageFromUrl } from '../../services/storageService';

export const CharacterDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { characters, addCharacter, deleteCharacter } = useStore();
    const { user } = useAuth();
    const { activeProjectId } = useProjects();

    const isNew = id === 'new';
    const existingCharacter = characters.find(c => c.id === id);


    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [comment, setComment] = useState('');
    const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
    const [type, setType] = useState<CharacterType | undefined>(undefined);

    // Track if potentially unsaved changes exist to avoid instant save on load
    const [isDirty, setIsDirty] = useState(false);

    // Debounce values to avoid saving on every keystroke
    const debouncedName = useDebounce(name, 1000);
    const debouncedDescription = useDebounce(description, 1000);
    const debouncedComment = useDebounce(comment, 1000);

    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error' | null>(null);

    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const saveTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    const latestStateRef = React.useRef({ name, description, comment, imageUrl, type });

    // Update ref whenever state changes
    useEffect(() => {
        latestStateRef.current = { name, description, comment, imageUrl, type };
    }, [name, description, comment, imageUrl, type]);

    // Initial load and sync effect
    useEffect(() => {
        if (existingCharacter) {
            // If we are dirty (user has typed), do NOT overwrite unless ID changed (navigation)
            // or unless current values match remote structure (e.g. after save)
            // simplified: only sync if not dirty OR if ID changed (navigation)

            const isSameCharacter = existingCharacter.id === id;

            // If navigating to a new ID (that is existing), always sync
            // If staying on same ID, only sync if not dirty (to avoid overwrite during typing)
            // BUT: if we just saved, existingCharacter updates. We want to clear isDirty if matches.

            if (!isSameCharacter || !isDirty) {
                setName(existingCharacter.name);
                setDescription(existingCharacter.description);
                setComment(existingCharacter.comment || '');
                setImageUrl(existingCharacter.imageUrl);
                setType(existingCharacter.type);
                setIsDirty(false);
            } else if (isDirty) {
                // Check if remote matches local (meaning save was successful and propagated)
                const matches =
                    existingCharacter.name === name &&
                    existingCharacter.description === description &&
                    (existingCharacter.comment || '') === comment &&
                    existingCharacter.imageUrl === imageUrl &&
                    existingCharacter.type === type;

                if (matches) {
                    setIsDirty(false);
                }
            }
        }
    }, [existingCharacter, id, name, description, comment, imageUrl, type, isDirty]);

    // Auto-save effect
    useEffect(() => {
        // Don't auto-save new characters or if not dirty
        if (isNew || !existingCharacter || !isDirty) return;

        // Don't save if name is empty
        if (!debouncedName.trim()) return;

        const save = async () => {
            // Clear any existing timeout to remove status
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

            setSaveStatus('saving');
            try {
                const characterData: Character = {
                    id: id!,
                    projectId: existingCharacter?.projectId || activeProjectId || '',
                    name: debouncedName,
                    description: debouncedDescription,
                    comment: debouncedComment,
                    imageUrl: imageUrl,
                    type: type,
                    order: existingCharacter.order,
                };

                await addCharacter(characterData);

                // Only show "Saved" if the current state still matches what we saved.
                // If user typed 'C' while we were saving 'B', latestState (B+C) != savedData (B).
                const current = latestStateRef.current;
                const isStillMatches =
                    current.name === characterData.name &&
                    current.description === characterData.description &&
                    (current.comment || '') === (characterData.comment || '') &&
                    current.imageUrl === characterData.imageUrl &&
                    current.type === characterData.type;

                if (isStillMatches) {
                    setSaveStatus('saved');
                    // Set timeout to clear saved status
                    saveTimeoutRef.current = setTimeout(() => {
                        setSaveStatus(null);
                    }, 2000);
                } else {
                    // If changed, silently finish (the next debounce wil trigger save)
                    // We might move back to null or keep 'saving'?
                    // Better to just clear status or let the next save cycle handle it.
                    // If we leave it 'saving', it might look stuck until next save start.
                    // If we set null, it just disappears.
                    // Since next save logic (debounce) is running, it will eventually call save() which sets 'saving'.
                    // So setting null here is safe.
                    setSaveStatus(null);
                }
            } catch (error) {
                console.error("Auto-save failed", error);
                setSaveStatus('error');
            }
        };

        const hasChanged =
            debouncedName !== existingCharacter.name ||
            debouncedDescription !== existingCharacter.description ||
            debouncedComment !== (existingCharacter.comment || '') ||
            imageUrl !== existingCharacter.imageUrl ||
            type !== existingCharacter.type;

        if (hasChanged) {
            save();
        }
    }, [debouncedName, debouncedDescription, debouncedComment, imageUrl, type, isNew, existingCharacter, addCharacter, id, isDirty]);

    // Handle Image change for auto-save immediately
    useEffect(() => {
        if (!isNew && existingCharacter && imageUrl !== existingCharacter.imageUrl) {
            setIsDirty(true);
        }
    }, [imageUrl, isNew, existingCharacter]);

    // Clean up timeout on unmount
    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        };
    }, []);


    const handleManualSave = async () => {
        if (!name.trim()) return;
        setIsSaving(true);
        try {
            const characterData: Character = {
                id: isNew ? crypto.randomUUID() : id!,
                projectId: existingCharacter?.projectId || activeProjectId || '',
                name,
                description,
                type,
            };

            if (existingCharacter?.order !== undefined) {
                characterData.order = existingCharacter.order;
            }

            if (comment) characterData.comment = comment;
            if (imageUrl) characterData.imageUrl = imageUrl;

            await addCharacter(characterData);
            navigate('..');
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
            navigate('..');
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
                <Button variant="ghost" onClick={() => navigate('..')} size="sm" className="-ml-3 text-primary-500">
                    <ArrowLeft size={16} /> Back to Characters
                </Button>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start gap-4 pb-6 border-b border-primary-200 dark:border-primary-800">
                <h1 className="text-4xl font-bold text-primary-900 dark:text-white">{isNew ? 'New Character' : name}</h1>
                <div className="flex gap-2 items-center">
                    {!isNew && (
                        <>
                            {saveStatus === 'saving' && (
                                <span className="text-primary-500 text-sm flex items-center gap-1">
                                    <Loader2 className="animate-spin" size={14} /> Saving...
                                </span>
                            )}
                            {saveStatus === 'saved' && (
                                <span className="text-green-600 dark:text-green-400 text-sm flex items-center gap-1 font-medium transition-opacity duration-500">
                                    Saved
                                </span>
                            )}
                            {saveStatus === 'error' && (
                                <span className="text-danger-600 text-sm font-medium">
                                    Error saving
                                </span>
                            )}
                            <div className="w-px h-6 bg-primary-200 dark:bg-primary-800 mx-1"></div>
                            <Button variant="danger" onClick={handleDelete} size="sm">
                                <Trash2 size={16} /> Delete
                            </Button>
                        </>
                    )}
                    {isNew && (
                        <Button onClick={handleManualSave} disabled={isSaving || !name} size="sm">
                            {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                            Create Character
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid gap-8">
                {/* Image Section */}
                <div className="flex flex-col md:flex-row gap-8 items-start">
                    <div className="w-full md:w-1/3 flex flex-col gap-4">
                        <div className="aspect-[3/4] bg-primary-100 dark:bg-primary-800 rounded-xl overflow-hidden relative group flex items-center justify-center border border-primary-200 dark:border-primary-700">
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
                                <User size={48} className="text-primary-300 dark:text-primary-600" />
                            )}
                        </div>

                        <div className="flex flex-col gap-2">
                            <input type="file" ref={fileInputRef} onChange={onFileSelected} className="hidden" accept="image/*" />
                            <Button size="sm" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                                {isUploading ? <Loader2 className="animate-spin" size={14} /> : <Upload size={14} />}
                                Upload Image
                            </Button>
                        </div>
                    </div>

                    <div className="w-full md:w-2/3 flex flex-col gap-6">
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium text-primary-900 dark:text-primary-300">Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => {
                                    setName(e.target.value);
                                    setIsDirty(true);
                                    setSaveStatus(null);
                                    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
                                }}
                                className="w-full p-3 rounded-lg bg-white dark:bg-primary-900 border border-primary-200 dark:border-primary-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                                placeholder="Character Name"
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium text-primary-900 dark:text-primary-300">Type</label>
                            <select
                                value={type || ''}
                                onChange={(e) => {
                                    setType((e.target.value as CharacterType) || undefined);
                                    setIsDirty(true);
                                    setSaveStatus(null);
                                    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
                                }}
                                className="w-full p-3 rounded-lg bg-white dark:bg-primary-900 border border-primary-200 dark:border-primary-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium appearance-none"
                            >
                                <option value="">Select a type...</option>
                                <option value="main">Main Character</option>
                                <option value="supporting">Supporting</option>
                                <option value="background">Background / Extra</option>
                                <option value="special">Special</option>
                            </select>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium text-primary-900 dark:text-primary-300">Description</label>
                            <textarea
                                value={description}
                                onChange={(e) => {
                                    setDescription(e.target.value);
                                    setIsDirty(true);
                                    setSaveStatus(null);
                                    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
                                }}
                                className="w-full p-3 rounded-lg bg-white dark:bg-primary-900 border border-primary-200 dark:border-primary-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all min-h-[120px]"
                                placeholder="Physical appearance, personality, role..."
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium text-primary-900 dark:text-primary-300">Notes / Comments</label>
                            <textarea
                                value={comment}
                                onChange={(e) => {
                                    setComment(e.target.value);
                                    setIsDirty(true);
                                    setSaveStatus(null);
                                    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
                                }}
                                className="w-full p-3 rounded-lg bg-white dark:bg-primary-900 border border-primary-200 dark:border-primary-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all min-h-[80px]"
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
                        className="absolute top-4 right-4 text-white hover:text-primary-300 transition-colors bg-black/50 rounded-full p-2"
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
