import React, { useReducer, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useStore } from '../../hooks/useStore';
import { useProjects } from '../../hooks/useProjects';
import { Button } from '../../components/ui/Button';
import { ArrowLeft, Save, Trash2, User, Loader2, Upload, X, Sparkles } from 'lucide-react';
import { ImageModal } from '../../components/ui/ImageModal';
import { useAuth } from '../../hooks/useAuth';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import type { Character, CharacterType } from '../../types/types';
import toast from 'react-hot-toast';
import { uploadFile, uploadImage, deleteImageFromUrl } from '../../services/storageService';
import { GenerateImageModal } from './GenerateImageModal';
import { generateImageBlob, type GenerateImageParams } from '../../services/pollinationsService';
import { usePollinationsAuth } from '../../hooks/usePollinationsAuth';

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

const initialCharacterState: CharacterState = {
    name: '',
    description: '',
    comment: '',
    imageUrl: undefined,
    type: undefined,
    isDirty: false,
    saveStatus: null,
};

function characterReducer(state: CharacterState, action: CharacterAction): CharacterState {
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
            return initialCharacterState;
        default:
            return state;
    }
}

export const CharacterDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { characters, addCharacter, deleteCharacter, settings } = useStore();
    const { user } = useAuth();
    const { activeProjectId } = useProjects();
    const { confirm, confirmDialog } = useConfirmDialog();

    const isNew = id === 'new';
    const existingCharacter = characters.find(c => c.id === id);

    const [state, dispatch] = useReducer(characterReducer, initialCharacterState);

    const { name, description, comment, imageUrl, type, isDirty, saveStatus } = state;

    const { apiKey, connect: connectPollinations, isConnected } = usePollinationsAuth();

    const [isUploading, setIsUploading] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showGenerateModal, setShowGenerateModal] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (existingCharacter) {
            dispatch({
                type: 'SYNC',
                payload: {
                    name: existingCharacter.name,
                    description: existingCharacter.description,
                    comment: existingCharacter.comment || '',
                    imageUrl: existingCharacter.imageUrl,
                    type: existingCharacter.type,
                },
            });
        } else if (isNew) {
            dispatch({ type: 'RESET' });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const handleSave = async () => {
        if (!name.trim()) return;
        dispatch({ type: 'SET_STATUS', status: 'saving' });
        try {
            if (isNew) {
                const newId = crypto.randomUUID();
                const characterData: Character = {
                    id: newId,
                    projectId: activeProjectId || '',
                    name, description, type, comment, imageUrl,
                    order: existingCharacter?.order,
                };
                await addCharacter(characterData);
                dispatch({ type: 'SAVED' });
                navigate(`../${newId}`, { replace: true });
            } else {
                const characterData: Character = {
                    ...existingCharacter!,
                    name, description, type, comment, imageUrl,
                };
                await addCharacter(characterData);
                dispatch({ type: 'SAVED' });
            }
        } catch (error) {
            console.error('Save failed', error);
            toast.error('Failed to save character.');
            dispatch({ type: 'SET_STATUS', status: 'error' });
        }
    };

    const handleDelete = async () => {
        if (await confirm('Are you sure you want to delete this character?', { title: 'Delete Character', confirmLabel: 'Delete' })) {
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
            toast.error(`Failed to upload image: ${message}`);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleRemoveImage = async () => {
        if (!imageUrl) return;
        if (await confirm('Remove this image?', { title: 'Remove Image', confirmLabel: 'Remove' })) {
            if (imageUrl.includes('firebasestorage')) {
                await deleteImageFromUrl(imageUrl);
            }
            dispatch({ type: 'SET_FIELD', field: 'imageUrl', value: undefined });
        }
    };

    const handleGenerateClick = () => {
        if (!isConnected) {
            toast('Redirecting to Pollinations to connect your account…', { icon: '🔗' });
            connectPollinations();
            return;
        }
        setShowGenerateModal(true);
    };

    const handleGenerate = async (params: GenerateImageParams) => {
        if (!user || !apiKey) return;
        setIsGenerating(true);
        const toastId = toast.loading('Generating image…');
        try {
            const blob = await generateImageBlob(params, apiKey);
            toast.loading('Uploading image…', { id: toastId });
            const url = await uploadImage(blob, user.uid);
            dispatch({ type: 'SET_FIELD', field: 'imageUrl', value: url });
            setShowGenerateModal(false);
            toast.success('Image generated!', { id: toastId });
        } catch (error: unknown) {
            console.error('Failed to generate image', error);
            const message = error instanceof Error ? error.message : 'Unknown error';
            toast.error(`Failed to generate image: ${message}`, { id: toastId });
        } finally {
            setIsGenerating(false);
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
                    className="inline-flex items-center gap-2 h-8 px-3 -ml-3 text-sm font-semibold rounded-lg transition-colors text-primary-500 hover:text-primary-900 hover:bg-primary-50 dark:text-primary-400 dark:hover:text-primary-100 dark:hover:bg-primary-900/60"
                >
                    <ArrowLeft size={16} /> Back to Characters
                </Link>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start gap-4 pb-6 border-b border-primary-200 dark:border-primary-800">
                <h1 className="text-4xl font-bold text-primary-900 dark:text-white">{isNew ? 'New Character' : name}</h1>
                <div className="flex gap-2 items-center">
                    {saveStatus === 'saving' && (
                        <span className="text-primary-500 text-sm flex items-center gap-1">
                            <Loader2 className="animate-spin" size={14} /> Saving...
                        </span>
                    )}
                    {saveStatus === 'saved' && (
                        <span className="text-green-600 dark:text-green-400 text-sm font-semibold">Saved</span>
                    )}
                    {saveStatus === 'error' && (
                        <span className="text-danger-600 text-sm font-semibold">Error saving</span>
                    )}
                    <Button onClick={handleSave} disabled={!isDirty || !name.trim() || saveStatus === 'saving'} size="sm">
                        <Save size={16} /> {isNew ? 'Create Character' : 'Save'}
                    </Button>
                    {!isNew && (
                        <>
                            <div className="w-px h-6 bg-primary-200 dark:bg-primary-800 mx-1"></div>
                            <Button variant="danger" onClick={handleDelete} size="sm">
                                <Trash2 size={16} /> Delete
                            </Button>
                        </>
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
                            <Button size="sm" onClick={() => fileInputRef.current?.click()} disabled={isUploading || isGenerating}>
                                {isUploading ? <Loader2 className="animate-spin" size={14} /> : <Upload size={14} />}
                                Upload Image
                            </Button>
                            <Button size="sm" variant="secondary" onClick={handleGenerateClick} disabled={isUploading || isGenerating}>
                                {isGenerating ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />}
                                Generate Image
                            </Button>
                        </div>
                    </div>

                    <div className="w-full md:w-2/3 flex flex-col gap-6">
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-semibold text-primary-900 dark:text-primary-300">Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'name', value: e.target.value })}
                                className="w-full p-3 rounded-lg bg-white dark:bg-primary-900 border border-primary-200 dark:border-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all font-medium"
                                placeholder="Character Name"
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-semibold text-primary-900 dark:text-primary-300">Type</label>
                            <select
                                value={type || ''}
                                onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'type', value: (e.target.value as CharacterType) || undefined })}
                                className="w-full p-3 rounded-lg bg-white dark:bg-primary-900 border border-primary-200 dark:border-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all font-medium appearance-none"
                            >
                                <option value="">Select a type...</option>
                                <option value="main">Main Character</option>
                                <option value="supporting">Supporting</option>
                                <option value="background">Background / Extra</option>
                                <option value="special">Special</option>
                            </select>
                        </div>

                        <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-semibold text-primary-900 dark:text-primary-300">Description</label>
                                <Button size="sm" variant="ghost" onClick={handleGenerateClick} disabled={isUploading || isGenerating} className="h-7 px-2 text-xs">
                                    {isGenerating ? <Loader2 className="animate-spin" size={12} /> : <Sparkles size={12} />}
                                    Generate Image
                                </Button>
                            </div>
                            <textarea
                                value={description}
                                onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'description', value: e.target.value })}
                                className="w-full p-3 rounded-lg bg-white dark:bg-primary-900 border border-primary-200 dark:border-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all min-h-[120px]"
                                placeholder="Physical appearance, personality, role..."
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-semibold text-primary-900 dark:text-primary-300">Notes / Comments</label>
                            <textarea
                                value={comment}
                                onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'comment', value: e.target.value })}
                                className="w-full p-3 rounded-lg bg-white dark:bg-primary-900 border border-primary-200 dark:border-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all min-h-[80px]"
                                placeholder="Internal notes, casting ideas..."
                            />
                        </div>
                    </div>
                </div>
            </div>

            {isFullscreen && imageUrl && (
                <ImageModal
                    src={imageUrl}
                    alt={name}
                    onClose={() => setIsFullscreen(false)}
                />
            )}
            {showGenerateModal && (
                <GenerateImageModal
                    initialPrompt={description || name}
                    defaults={{
                        model: settings.pollinationsModel,
                        sizeIndex: settings.pollinationsSizeIndex,
                        enhance: settings.pollinationsEnhance,
                        seed: settings.pollinationsSeed,
                    }}
                    isGenerating={isGenerating}
                    onClose={() => !isGenerating && setShowGenerateModal(false)}
                    onConfirm={handleGenerate}
                />
            )}
            {confirmDialog}
        </div>
    );
};
