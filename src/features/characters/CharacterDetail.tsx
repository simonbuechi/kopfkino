import React, { useReducer, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useStore } from '../../hooks/useStore';
import { useProjects } from '../../hooks/useProjects';
import { Button } from '../../components/ui/Button';
import { ArrowLeft, Save, Trash2, User, Loader2, Upload, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
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

    interface CharacterState {
        name: string;
        description: string;
        comment: string;
        imageUrl?: string;
        type?: CharacterType;
        isDirty: boolean;
        saveStatus: 'saved' | 'saving' | 'error' | null;
    }

    type CharacterAction = 
        | { type: 'SET_FIELD'; field: string; value: string | number | boolean | string[] | undefined | CharacterType }
        | { type: 'SET_MULTIPLE'; payload: Partial<CharacterState> }
        | { type: 'SET_STATUS'; status: 'saved' | 'saving' | 'error' | null }
        | { type: 'SAVED' }
        | { type: 'SYNC'; payload: Partial<CharacterState> }
        | { type: 'RESET' };

    // Local state for editing using a reducer
    const [state, dispatch] = useReducer((state: CharacterState, action: CharacterAction): CharacterState => {
        switch (action.type) {
            case 'SET_FIELD':
                return { ...state, [action.field]: action.value, isDirty: true, saveStatus: null };
            case 'SET_MULTIPLE':
                return { ...state, ...action.payload, isDirty: true, saveStatus: null };
            case 'SET_STATUS':
                return { ...state, saveStatus: action.status };
            case 'SAVED':
                return { ...state, saveStatus: 'saved', isDirty: false };
            case 'SYNC':
                return { ...state, ...action.payload, isDirty: false };
            case 'RESET':
                return {
                    name: '',
                    description: '',
                    comment: '',
                    imageUrl: undefined,
                    type: undefined,
                    isDirty: false,
                    saveStatus: null
                };
            default:
                return state;
        }
    }, {
        name: '',
        description: '',
        comment: '',
        imageUrl: undefined,
        type: undefined,
        isDirty: false,
        saveStatus: null
    });

    const { name, description, comment, imageUrl, type, isDirty, saveStatus } = state;

    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const debouncedName = useDebounce(name, 1000);
    const debouncedDescription = useDebounce(description, 1000);
    const debouncedComment = useDebounce(comment, 1000);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const latestStateRef = useRef(state);

    useEffect(() => {
        latestStateRef.current = state;
    }, [state]);

    // Initial load and sync effect
    useEffect(() => {
        if (existingCharacter) {
            const payload = {
                name: existingCharacter.name,
                description: existingCharacter.description,
                comment: existingCharacter.comment || '',
                imageUrl: existingCharacter.imageUrl,
                type: existingCharacter.type
            };

            const needsSync = 
                payload.name !== name ||
                payload.description !== description ||
                payload.comment !== comment ||
                payload.imageUrl !== imageUrl ||
                payload.type !== type;

            if (needsSync && (!isDirty || existingCharacter.id !== id)) {
                dispatch({ type: 'SYNC', payload });
            }
        } else if (isNew) {
            dispatch({ type: 'RESET' });
        }
    }, [existingCharacter, id, isNew, name, description, comment, imageUrl, type, isDirty]);

    // Auto-save effect
    useEffect(() => {
        if (isNew || !existingCharacter || !isDirty) return;
        if (!debouncedName.trim()) return;

        const save = async () => {
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
            dispatch({ type: 'SET_STATUS', status: 'saving' });

            try {
                const characterData: Character = {
                    ...existingCharacter,
                    name: debouncedName,
                    description: debouncedDescription,
                    comment: debouncedComment,
                    imageUrl: imageUrl,
                    type: type,
                };

                await addCharacter(characterData);

                const current = latestStateRef.current;
                const isStillMatches =
                    current.name === characterData.name &&
                    current.description === characterData.description &&
                    (current.comment || '') === (characterData.comment || '') &&
                    current.imageUrl === characterData.imageUrl &&
                    current.type === characterData.type;

                if (isStillMatches) {
                    dispatch({ type: 'SAVED' });
                    saveTimeoutRef.current = setTimeout(() => {
                        dispatch({ type: 'SET_STATUS', status: null });
                    }, 2000);
                } else {
                    dispatch({ type: 'SET_STATUS', status: null });
                }
            } catch (error) {
                console.error("Auto-save failed", error);
                dispatch({ type: 'SET_STATUS', status: 'error' });
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
                comment,
                imageUrl,
                order: existingCharacter?.order
            };

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
            dispatch({ type: 'SET_FIELD', field: 'imageUrl', value: url });
        } catch (error: unknown) {
            console.error("Failed to upload image", error);
            const message = error instanceof Error ? error.message : 'Unknown error';
            alert(`Failed to upload image: ${message}`);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleRemoveImage = async () => {
        if (!imageUrl) return;
        if (confirm('Remove this image?')) {
            if (imageUrl.includes('firebasestorage')) {
                await deleteImageFromUrl(imageUrl);
            }
            dispatch({ type: 'SET_FIELD', field: 'imageUrl', value: undefined });
        }
    };

    if (!isNew && !existingCharacter) {
        return <div className="p-8">Character not found</div>;
    }

    return (
        <div className="flex flex-col gap-8 w-full max-w-3xl mx-auto">
            <div>
                <Link
                    to=".."
                    className="inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none hover:bg-primary-100 dark:hover:bg-primary-800 text-primary-500 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-100 h-8 px-3 text-sm -ml-3 gap-2"
                >
                    <ArrowLeft size={16} /> Back to Characters
                </Link>
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
                                onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'name', value: e.target.value })}
                                className="w-full p-3 rounded-lg bg-white dark:bg-primary-900 border border-primary-200 dark:border-primary-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                                placeholder="Character Name"
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium text-primary-900 dark:text-primary-300">Type</label>
                            <select
                                value={type || ''}
                                onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'type', value: (e.target.value as CharacterType) || undefined })}
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
                                onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'description', value: e.target.value })}
                                className="w-full p-3 rounded-lg bg-white dark:bg-primary-900 border border-primary-200 dark:border-primary-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all min-h-[120px]"
                                placeholder="Physical appearance, personality, role..."
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium text-primary-900 dark:text-primary-300">Notes / Comments</label>
                            <textarea
                                value={comment}
                                onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'comment', value: e.target.value })}
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
