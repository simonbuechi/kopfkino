import React, { useReducer, useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useStore } from '../../hooks/useStore';
import { useProjects } from '../../hooks/useProjects';
import { useAuth } from '../../hooks/useAuth';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import { Button } from '../../components/ui/Button';
import { ArrowLeft, Save, Trash2, Loader2, Upload, X } from 'lucide-react';
import type { Shot } from '../../types/types';
import toast from 'react-hot-toast';
import { uploadFile } from '../../services/storageService';

interface ShotState {
    name: string;
    description: string;
    notes: string;
    visualizationUrl: string;
    length: number;
    audio: boolean;
    isDirty: boolean;
    saveStatus: 'saved' | 'saving' | 'error' | null;
}

type ShotAction =
    | { type: 'SET_FIELD'; field: string; value: string | number | boolean }
    | { type: 'SET_STATUS'; status: 'saved' | 'saving' | 'error' | null }
    | { type: 'SAVED' }
    | { type: 'SYNC'; payload: Partial<ShotState> }
    | { type: 'RESET' };

const DEFAULT_DESCRIPTION = `Size: (full, medium, close-up)
Angle: (eye, shoulder, hip, dutch)
Framing: (single, two, three, over-the-shoulder, point-of-view)
Movement: (static, tracking, dolly, pan, tilt, zoom)
Focus: (shallow, deep)`;

const initialState: ShotState = {
    name: '',
    description: DEFAULT_DESCRIPTION,
    notes: '',
    visualizationUrl: '',
    length: 0,
    audio: true,
    isDirty: false,
    saveStatus: null,
};

function shotReducer(state: ShotState, action: ShotAction): ShotState {
    switch (action.type) {
        case 'SET_FIELD':
            return { ...state, [action.field]: action.value, isDirty: true, saveStatus: null };
        case 'SET_STATUS':
            return { ...state, saveStatus: action.status };
        case 'SAVED':
            return { ...state, saveStatus: 'saved', isDirty: false };
        case 'SYNC':
            return { ...state, ...action.payload, isDirty: false };
        case 'RESET':
            return initialState;
        default:
            return state;
    }
}

export const ShotDetail: React.FC = () => {
    const { id: sceneId, shotId } = useParams<{ id: string; shotId: string }>();
    const navigate = useNavigate();
    const { scenes, addShotToScene, updateShotInScene, deleteShotFromScene } = useStore();
    const { activeProjectId } = useProjects();
    const { user } = useAuth();
    const { confirm, confirmDialog } = useConfirmDialog();

    const isNew = shotId === 'new';
    const scene = scenes.find(s => s.id === sceneId);
    const existingShot = isNew ? undefined : scene?.shots?.find(s => s.id === shotId);

    const [state, dispatch] = useReducer(shotReducer, initialState);
    const { name, description, notes, visualizationUrl, length, audio, isDirty, saveStatus } = state;

    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const syncedKey = useRef('');

    useEffect(() => {
        const key = `${sceneId}:${shotId}`;
        if (key === syncedKey.current) return;
        if (isNew) {
            syncedKey.current = key;
            dispatch({ type: 'RESET' });
        } else if (existingShot) {
            syncedKey.current = key;
            dispatch({
                type: 'SYNC',
                payload: {
                    name: existingShot.name,
                    description: existingShot.description || '',
                    notes: existingShot.notes || '',
                    visualizationUrl: existingShot.visualizationUrl || '',
                    length: existingShot.length ?? 0,
                    audio: existingShot.audio ?? true,
                },
            });
        }
    }, [shotId, sceneId, existingShot, isNew]);

    const sceneUrl = `/project/${activeProjectId}/scenes/${sceneId}`;

    const handleSave = async () => {
        if (!name.trim() || !sceneId) return;
        dispatch({ type: 'SET_STATUS', status: 'saving' });
        try {
            if (isNew) {
                const newShot: Shot = {
                    id: crypto.randomUUID(),
                    name, description, notes, visualizationUrl, length, audio,
                };
                await addShotToScene(sceneId, newShot);
                dispatch({ type: 'SAVED' });
                navigate(`/project/${activeProjectId}/scenes/${sceneId}/shots/${newShot.id}`, { replace: true });
            } else {
                await updateShotInScene(sceneId, { ...existingShot!, name, description, notes, visualizationUrl, length, audio });
                dispatch({ type: 'SAVED' });
            }
        } catch (error) {
            console.error('Save failed', error);
            toast.error('Failed to save shot.');
            dispatch({ type: 'SET_STATUS', status: 'error' });
        }
    };

    const handleDelete = async () => {
        if (!sceneId || !shotId) return;
        if (await confirm('Are you sure you want to delete this shot?', { title: 'Delete Shot', confirmLabel: 'Delete' })) {
            await deleteShotFromScene(sceneId, shotId);
            navigate(sceneUrl);
        }
    };

    const onFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !user) return;
        setIsUploading(true);
        try {
            const url = await uploadFile(file, user.uid);
            dispatch({ type: 'SET_FIELD', field: 'visualizationUrl', value: url });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            toast.error(`Failed to upload image: ${message}`);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const inputClass = "bg-white dark:bg-primary-900 border border-primary-200 dark:border-primary-700 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder-primary-300 dark:placeholder-primary-700 transition-colors hover:border-primary-300 dark:hover:border-primary-600 shadow-sm text-primary-900 dark:text-white";

    if (!scene) return <div className="p-8">Scene not found</div>;
    if (!isNew && !existingShot) return <div className="p-8">Shot not found</div>;

    return (
        <div className="flex flex-col gap-8 w-full max-w-3xl mx-auto">
            <div>
                <Link
                    to={sceneUrl}
                    className="inline-flex items-center gap-2 h-8 px-3 -ml-3 text-sm font-semibold rounded-lg transition-colors text-primary-500 hover:text-primary-900 hover:bg-primary-50 dark:text-primary-400 dark:hover:text-primary-100 dark:hover:bg-primary-900/60"
                >
                    <ArrowLeft size={16} /> Back to Scene {scene.number}
                </Link>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start gap-4 pb-6 border-b border-primary-200 dark:border-primary-800">
                <h1 className="text-4xl font-bold text-primary-900 dark:text-white">{isNew ? 'New Shot' : name}</h1>
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
                        <Save size={16} /> {isNew ? 'Create Shot' : 'Save'}
                    </Button>
                    {!isNew && (
                        <>
                            <div className="w-px h-6 bg-primary-200 dark:bg-primary-800 mx-1" />
                            <Button variant="danger" onClick={handleDelete} size="sm">
                                <Trash2 size={16} /> Delete
                            </Button>
                        </>
                    )}
                </div>
            </div>

            <div className="grid gap-6">
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-primary-900 dark:text-primary-300">Name</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'name', value: e.target.value })}
                        className={inputClass}
                        placeholder="e.g. close-up protagonist"
                    />
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-primary-900 dark:text-primary-300">Length (seconds)</label>
                        <input
                            type="number"
                            value={length || ''}
                            onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'length', value: Number(e.target.value) })}
                            className={inputClass}
                            placeholder="Seconds"
                        />
                    </div>
                    <div className="flex items-center gap-3 pt-6">
                        <input
                            type="checkbox"
                            id="audio"
                            checked={audio}
                            onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'audio', value: e.target.checked })}
                            className="w-4 h-4 text-primary-900 bg-gray-100 border-gray-300 rounded focus:ring-primary-900 dark:focus:ring-primary-600 dark:ring-offset-primary-800 focus:ring-2 dark:bg-primary-700 dark:border-primary-600"
                        />
                        <label htmlFor="audio" className="text-sm font-semibold text-primary-900 dark:text-primary-100">Has Audio</label>
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-primary-900 dark:text-primary-300">Description</label>
                    <textarea
                        value={description}
                        onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'description', value: e.target.value })}
                        className={`${inputClass} min-h-[160px] resize-y`}
                        placeholder="Visual description of the shot..."
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-primary-900 dark:text-primary-300">Notes</label>
                    <textarea
                        value={notes}
                        onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'notes', value: e.target.value })}
                        className={`${inputClass} min-h-[80px] resize-y`}
                        placeholder="Additional notes..."
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-primary-900 dark:text-primary-300">Visualization</label>
                    {visualizationUrl ? (
                        <div className="relative w-full max-w-sm">
                            <img src={visualizationUrl} alt="Shot visualization" className="w-full rounded-lg border border-primary-200 dark:border-primary-700" />
                            <button
                                onClick={() => dispatch({ type: 'SET_FIELD', field: 'visualizationUrl', value: '' })}
                                className="absolute top-2 right-2 bg-black/60 text-white p-1.5 rounded-full hover:bg-black/80 transition-colors"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    ) : (
                        <>
                            <input type="file" ref={fileInputRef} onChange={onFileSelected} className="hidden" accept="image/*" />
                            <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="w-fit">
                                {isUploading ? <Loader2 className="animate-spin" size={14} /> : <Upload size={14} />}
                                Upload Image
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {confirmDialog}
        </div>
    );
};
