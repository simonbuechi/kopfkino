import React, { useReducer, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useStore } from '../../hooks/useStore';
import { useProjects } from '../../hooks/useProjects';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import { Button } from '../../components/ui/Button';
import { MapPin, Trash2, ArrowLeft, ImageIcon, Loader2, X, Upload, Star, Save } from 'lucide-react';
import { deleteImageFromUrl, uploadFile } from '../../services/storageService';
import { useFileUpload } from '../../hooks/useFileUpload';
import toast from 'react-hot-toast';
import type { Location, LocationType } from '../../types/types';

interface LocationState {
    name: string;
    description: string;
    geolocation: string;
    comment: string;
    images: string[];
    thumbnailUrl: string;
    type?: LocationType;
    isDirty: boolean;
    saveStatus: 'saved' | 'saving' | 'error' | null;
}

type LocationAction =
    | { type: 'SET_FIELD'; field: string; value: string | number | boolean | string[] | undefined }
    | { type: 'SET_MULTIPLE'; payload: Partial<LocationState> }
    | { type: 'SET_STATUS'; status: 'saved' | 'saving' | 'error' | null }
    | { type: 'SAVED' }
    | { type: 'SYNC'; payload: Partial<LocationState> };

const initialLocationState: LocationState = {
    name: '',
    description: '',
    geolocation: '',
    comment: '',
    images: [],
    thumbnailUrl: '',
    type: undefined,
    isDirty: false,
    saveStatus: null,
};

function locationReducer(state: LocationState, action: LocationAction): LocationState {
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
        default:
            return state;
    }
}

export const LocationDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { locations, deleteLocation, saveLocation, scenes } = useStore();
    const { activeProjectId } = useProjects();
    const { confirm, confirmDialog } = useConfirmDialog();

    // Derived state
    const location = locations.find((l) => l.id === id);
    const associatedScenes = scenes.filter(s => s.locationId === id);

    const [state, dispatch] = useReducer(locationReducer, initialLocationState);

    const { name, description, geolocation, comment, images, thumbnailUrl, type, isDirty, saveStatus } = state;

    const syncedId = useRef('');
    useEffect(() => {
        if (id === syncedId.current || !location) return;
        syncedId.current = id ?? '';
        dispatch({
            type: 'SYNC',
            payload: {
                name: location.name,
                description: location.description,
                geolocation: location.geolocation || '',
                comment: location.comment || '',
                images: location.images || [],
                thumbnailUrl: location.thumbnailUrl || '',
                type: location.type,
            },
        });
    }, [id, location]);

    const handleSave = async () => {
        if (!name.trim()) return;
        dispatch({ type: 'SET_STATUS', status: 'saving' });
        try {
            const locationData: Location = {
                ...location!,
                name, description, geolocation, comment, images, thumbnailUrl, type,
            };
            await saveLocation(locationData);
            dispatch({ type: 'SAVED' });
        } catch (error) {
            console.error('Save failed', error);
            dispatch({ type: 'SET_STATUS', status: 'error' });
        }
    };

    const { fileInputRef, isUploading, handleClick: handleImageUploadClick, handleChange: onFileSelected } = useFileUpload(
        async (file) => {
            if (!activeProjectId) return;
            try {
                const permanentUrl = await uploadFile(file, activeProjectId);
                const updatedImages = [...images, permanentUrl].slice(0, 4);
                dispatch({ type: 'SET_MULTIPLE', payload: {
                    images: updatedImages,
                    thumbnailUrl: thumbnailUrl || permanentUrl
                }});
            } catch (error) {
                console.error("Failed to upload image", error);
                toast.error('Failed to upload image.');
            }
        }
    );

    if (!location) {
        return <div className="p-8">Location not found</div>;
    }

    const handleDelete = async () => {
        if (await confirm('Are you sure you want to delete this location?', { title: 'Delete Location', confirmLabel: 'Delete' })) {
            deleteLocation(location.id);
            navigate('..');
        }
    };

    const handleDeleteImage = async (imageUrl: string) => {
        if (await confirm('Delete this image?', { title: 'Delete Image', confirmLabel: 'Delete' })) {
            // 1. Update Local State (Effect will trigger save)
            const updatedImages = images.filter((img: string) => img !== imageUrl);
            dispatch({ type: 'SET_MULTIPLE', payload: {
                images: updatedImages,
                thumbnailUrl: thumbnailUrl === imageUrl ? (updatedImages[0] || '') : thumbnailUrl
            }});

            // 2. Delete from Storage (fire and forget)
            await deleteImageFromUrl(imageUrl);
        }
    };

    return (
        <div className="flex flex-col gap-8 w-full max-w-5xl mx-auto">
            <div>
                <Link
                    to=".."
                    className="inline-flex items-center gap-2 h-8 px-3 -ml-3 text-sm font-semibold rounded-lg transition-colors text-primary-500 hover:text-primary-900 hover:bg-primary-50 dark:text-primary-400 dark:hover:text-primary-100 dark:hover:bg-primary-900/60"
                >
                    <ArrowLeft size={16} /> Back to Locations
                </Link>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start gap-4 pb-6 border-b border-primary-200 dark:border-primary-800">
                <div className="flex-1 w-full">
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'name', value: e.target.value })}
                        className="text-4xl font-bold text-primary-900 dark:text-white mb-2 bg-white dark:bg-primary-900 border border-primary-200 dark:border-primary-700 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-primary-300 dark:placeholder-primary-700 transition-colors hover:border-primary-300 dark:hover:border-primary-600 shadow-sm"
                        placeholder="Location Name"
                    />
                </div>
                <div className="flex gap-2 items-center flex-wrap justify-end">
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
                        <Save size={16} /> Save
                    </Button>
                    <div className="w-px h-6 bg-primary-200 dark:bg-primary-800 mx-1"></div>
                    <Button
                        onClick={handleImageUploadClick}
                        disabled={isUploading || images.length >= 4}
                        size="sm"
                        variant="secondary"
                        title={images.length >= 4 ? "Maximum 4 images allowed" : "Upload Image"}
                    >
                        {isUploading ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
                        {isUploading ? 'Uploading...' : 'Upload Image'}
                    </Button>
                    <div className="w-px h-6 bg-primary-200 dark:bg-primary-800 mx-1"></div>
                    <Button variant="danger" onClick={handleDelete} size="sm">
                        <Trash2 size={16} /> Delete
                    </Button>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                {/* Left Side: Images */}
                <div className="space-y-6">
                    <section>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-primary-900 dark:text-white">Images ({images.length}/4)</h3>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={onFileSelected}
                                className="hidden"
                                accept="image/*"
                                disabled={images.length >= 4}
                            />
                        </div>

                        {(images && images.length > 0) ? (
                            <div className="grid grid-cols-1 gap-4">
                                {images.map((img: string, idx: number) => (
                                    <div key={idx} className={`relative rounded-xl overflow-hidden group aspect-video bg-primary-100 dark:bg-primary-800 border-2 ${thumbnailUrl === img ? 'border-primary-500' : 'border-transparent'}`}>
                                        <img src={img} alt={`Location viz ${idx}`} className="w-full h-full object-cover" />
                                        <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => dispatch({ type: 'SET_FIELD', field: 'thumbnailUrl', value: img })}
                                                className={`p-1.5 rounded-full transition-colors ${thumbnailUrl === img ? 'bg-primary-500 text-white' : 'bg-black/60 text-white hover:bg-black/80'}`}
                                                title={thumbnailUrl === img ? "Primary Image" : "Set as Primary"}
                                            >
                                                <Star size={14} fill={thumbnailUrl === img ? "currentColor" : "none"} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteImage(img)}
                                                className="bg-black/60 text-white p-1.5 rounded-full hover:bg-black/80"
                                                title="Delete Image"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                        {thumbnailUrl === img && (
                                            <div className="absolute bottom-2 left-2 bg-primary-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm">
                                                PRIMARY
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            thumbnailUrl ? (
                                <div className="rounded-xl overflow-hidden aspect-video bg-primary-100 dark:bg-primary-800 max-h-[400px]">
                                    <img
                                        src={thumbnailUrl}
                                        alt={name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 text-primary-400 border border-dashed border-primary-200 dark:border-primary-800 rounded-xl bg-primary-50/50 dark:bg-primary-900/50">
                                    <ImageIcon size={24} className="mb-2 opacity-20" />
                                    <p className="italic">No images yet.</p>
                                </div>
                            )
                        )}
                    </section>
                </div>

                {/* Right Side: Details */}
                <div className="flex flex-col gap-6">
                    <section className="flex flex-col gap-2">
                        <h3 className="font-semibold text-primary-900 dark:text-white">Location Details</h3>
                        <div className="flex gap-4 text-primary-500 items-center">
                            <MapPin size={16} className="shrink-0" />
                            <input
                                type="text"
                                value={geolocation}
                                onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'geolocation', value: e.target.value })}
                                className="bg-white dark:bg-primary-900 border border-primary-200 dark:border-primary-700 rounded-md px-3 py-1.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-primary-400 transition-colors hover:border-primary-300 dark:hover:border-primary-600 shadow-sm"
                                placeholder="Add geolocation..."
                            />
                            <select
                                value={type || ''}
                                onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'type', value: (e.target.value as LocationType) || undefined })}
                                className="bg-white dark:bg-primary-900 border border-primary-200 dark:border-primary-700 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors hover:border-primary-300 dark:hover:border-primary-600 shadow-sm appearance-none font-semibold text-primary-700 dark:text-primary-300"
                            >
                                <option value="">Select Type...</option>
                                <option value="INT.">INT.</option>
                                <option value="EXT.">EXT.</option>
                                <option value="INT./EXT.">INT./EXT.</option>
                            </select>
                        </div>
                    </section>

                    <section className="flex flex-col gap-2 flex-grow">
                        <h3 className="font-semibold text-primary-900 dark:text-white">Description</h3>
                        <textarea
                            value={description}
                            onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'description', value: e.target.value })}
                            className="w-full p-3 rounded-lg bg-white dark:bg-primary-900 border border-primary-200 dark:border-primary-700 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-primary-300 dark:hover:border-primary-600 transition-all min-h-[120px] resize-y shadow-sm flex-grow"
                            placeholder="Detailed description of the location..."
                        />
                    </section>

                    <section className="flex flex-col gap-2">
                        <h3 className="font-semibold text-primary-900 dark:text-white">Notes</h3>
                        <textarea
                            value={comment}
                            onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'comment', value: e.target.value })}
                            className="w-full p-3 rounded-lg bg-white dark:bg-primary-900 border border-primary-200 dark:border-primary-700 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-primary-300 dark:hover:border-primary-600 transition-all min-h-[120px] resize-y shadow-sm"
                            placeholder="Notes about lighting, access, etc."
                        />
                    </section>
                </div>
            </div>

            <section>
                <h3 className="font-semibold text-primary-900 dark:text-white mb-4">Scenes ({associatedScenes.length})</h3>
                {associatedScenes.length > 0 ? (
                    <div className="grid gap-3">
                        {associatedScenes.map(scene => (
                            <div key={scene.id} onClick={() => navigate(`../../scenes/${scene.id}`)} className="flex items-center gap-4 p-4 rounded-lg border border-primary-200 dark:border-primary-800 hover:bg-primary-50 dark:hover:bg-primary-900 cursor-pointer transition-colors bg-white dark:bg-primary-950/50">
                                <span className="font-mono font-bold text-primary-400 w-8">{scene.number}</span>
                                <span className="font-medium text-primary-900 dark:text-white">{scene.name}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-primary-500">No scenes linked to this location.</p>
                )}
            </section>
            {confirmDialog}
        </div>
    );
};
