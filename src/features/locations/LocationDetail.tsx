import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useStore } from '../../hooks/useStore';
import { Button } from '../../components/ui/Button';
import { MapPin, Trash2, ArrowLeft, Sparkles, Loader2, X, Upload } from 'lucide-react';
import { generateImage } from '../../services/ai';
import { uploadImageFromUrl, deleteImageFromUrl, uploadFile } from '../../services/storageService';
import { useAuth } from '../../context/AuthContext';
import { useDebounce } from '../../hooks/useDebounce';
import type { Location, LocationType } from '../../types/types';

export const LocationDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { locations, deleteLocation, addLocation, scenes, settings } = useStore();
    const { user } = useAuth();

    // Derived state
    const location = locations.find((l) => l.id === id);
    const associatedScenes = scenes.filter(s => s.locationId === id);

    // Local state for editing
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [geolocation, setGeolocation] = useState('');
    const [comment, setComment] = useState('');
    const [images, setImages] = useState<string[]>([]);
    const [thumbnailUrl, setThumbnailUrl] = useState<string>('');
    const [type, setType] = useState<LocationType | undefined>(undefined);

    const [isGenerating, setIsGenerating] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    // Auto-save state
    const [isDirty, setIsDirty] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error' | null>(null);

    const debouncedName = useDebounce(name, 1000);
    const debouncedDescription = useDebounce(description, 1000);
    const debouncedGeolocation = useDebounce(geolocation, 1000);
    const debouncedComment = useDebounce(comment, 1000);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const latestStateRef = useRef({ name, description, geolocation, comment, images, thumbnailUrl, type });

    // Update ref whenever state changes
    useEffect(() => {
        latestStateRef.current = { name, description, geolocation, comment, images, thumbnailUrl, type };
    }, [name, description, geolocation, comment, images, thumbnailUrl, type]);

    // Initial load and sync effect
    useEffect(() => {
        if (location) {
            const isSameLocation = location.id === id;

            if (!isSameLocation || !isDirty) {
                // Only update if value actually changed to prevent loops
                if (location.name !== name) setName(location.name);
                if (location.description !== description) setDescription(location.description);
                if ((location.geolocation || '') !== geolocation) setGeolocation(location.geolocation || '');
                if ((location.comment || '') !== comment) setComment(location.comment || '');

                // Deep check for arrays
                if (JSON.stringify(location.images || []) !== JSON.stringify(images)) {
                    setImages(location.images || []);
                }

                if ((location.thumbnailUrl || '') !== thumbnailUrl) setThumbnailUrl(location.thumbnailUrl || '');
                if (location.type !== type) setType(location.type);

                if (isDirty) setIsDirty(false); // Only set if needed
            } else if (isDirty) {
                // Check if remote matches local
                const matches =
                    location.name === name &&
                    location.description === description &&
                    (location.geolocation || '') === geolocation &&
                    (location.comment || '') === comment &&
                    JSON.stringify(location.images || []) === JSON.stringify(images) &&
                    (location.thumbnailUrl || '') === thumbnailUrl &&
                    location.type === type;

                if (matches) {
                    setIsDirty(false);
                }
            }
        }
    }, [location, id, name, description, geolocation, comment, images, thumbnailUrl, type, isDirty]);

    // Auto-save effect
    useEffect(() => {
        if (!location || !isDirty) return;
        if (!debouncedName.trim()) return;

        const save = async () => {
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
            setSaveStatus('saving');

            try {
                const locationData: Location = {
                    ...location,
                    name: debouncedName,
                    description: debouncedDescription,
                    geolocation: debouncedGeolocation,
                    comment: debouncedComment,
                    images: images,
                    thumbnailUrl: thumbnailUrl,
                    type: type,
                };

                await addLocation(locationData);

                // Check staleness
                const current = latestStateRef.current;
                const isStillMatches =
                    current.name === locationData.name &&
                    current.description === locationData.description &&
                    current.geolocation === (locationData.geolocation || '') &&
                    current.comment === (locationData.comment || '') &&
                    JSON.stringify(current.images) === JSON.stringify(locationData.images) &&
                    current.thumbnailUrl === (locationData.thumbnailUrl || '') &&
                    current.type === locationData.type;

                if (isStillMatches) {
                    setSaveStatus('saved');
                    saveTimeoutRef.current = setTimeout(() => {
                        setSaveStatus(null);
                    }, 2000);
                } else {
                    setSaveStatus(null);
                }

            } catch (error) {
                console.error("Auto-save failed", error);
                setSaveStatus('error');
            }
        };

        const hasChanged =
            debouncedName !== location.name ||
            debouncedDescription !== location.description ||
            debouncedGeolocation !== (location.geolocation || '') ||
            debouncedComment !== (location.comment || '') ||
            JSON.stringify(images) !== JSON.stringify(location.images || []) ||
            thumbnailUrl !== (location.thumbnailUrl || '') ||
            type !== location.type;

        if (hasChanged) {
            save();
        }

    }, [debouncedName, debouncedDescription, debouncedGeolocation, debouncedComment, images, thumbnailUrl, location, addLocation, isDirty]);

    // Cleanup timeout
    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        };
    }, []);

    // Effect to mark dirty on image changes (immediate)
    useEffect(() => {
        if (location) {
            const imagesChanged = JSON.stringify(images) !== JSON.stringify(location.images || []);
            const thumbChanged = thumbnailUrl !== (location.thumbnailUrl || '');
            if (imagesChanged || thumbChanged) {
                setIsDirty(true);
            }
        }
    }, [images, thumbnailUrl, location]);


    if (!location) {
        return <div className="p-8">Location not found</div>;
    }

    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this location?')) {
            deleteLocation(location.id);
            navigate('..');
        }
    };

    const handleGenerateImage = async () => {
        if (!user) return;
        if (!settings.aiApiKey) {
            alert('Please set your API Key in Settings before generating images.');
            return;
        }
        setIsGenerating(true);
        const prompt = `Cinematic location concept art: ${name}. 
        Description: ${description}. 
        Geolocation/Context: ${geolocation}. 
        Mood: Atmospheric, high detail, photorealistic, 8k.`;

        // Determine dimensions based on aspect ratio setting
        let width = 1024;
        let height = 1024;
        if (settings.aspectRatio === '16:9') {
            width = 1280;
            height = 720;
        }

        const options = {
            width,
            height,
            seed: settings.useRandomSeed ? undefined : settings.customSeed
        };

        try {
            // 1. Generate (External URL)
            const tempUrl = await generateImage(prompt, settings.aiApiKey, options);

            // 2. Upload to Firebase Storage
            const permanentUrl = await uploadImageFromUrl(tempUrl, user.uid);

            // 3. Update Local State (Effect will trigger save)
            const updatedImages = [...images, permanentUrl];
            setImages(updatedImages);
            if (!thumbnailUrl) setThumbnailUrl(permanentUrl);
            setIsDirty(true); // Ensure dirty to prevent sync revert

        } catch (error) {
            console.error("Failed to generate or upload image", error);
            alert("Failed to generate image. Ensure popups are allowed if Auth is pending, or check console.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDeleteImage = async (imageUrl: string) => {
        if (confirm('Delete this image?')) {
            // 1. Update Local State (Effect will trigger save)
            const updatedImages = images.filter(img => img !== imageUrl);
            setImages(updatedImages);
            if (thumbnailUrl === imageUrl) {
                setThumbnailUrl(updatedImages[0] || '');
            }
            setIsDirty(true); // Ensure dirty to prevent sync revert

            // 2. Delete from Storage (fire and forget)
            await deleteImageFromUrl(imageUrl);
        }
    };

    const handleImageUploadClick = () => {
        fileInputRef.current?.click();
    };

    const onFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !user) return;

        setIsUploading(true);
        try {
            // 1. Upload to Firebase Storage
            const permanentUrl = await uploadFile(file, user.uid);

            // 2. Update Local State (Effect will trigger save)
            const updatedImages = [...images, permanentUrl];
            setImages(updatedImages);
            if (!thumbnailUrl) setThumbnailUrl(permanentUrl);
            setIsDirty(true); // Ensure dirty to prevent sync revert

        } catch (error) {
            console.error("Failed to upload image", error);
            alert("Failed to upload image.");
        } finally {
            setIsUploading(false);
            // Reset input so valid file can be selected again if needed
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className="flex flex-col gap-8 w-full max-w-5xl mx-auto">
            <div>
                <Link
                    to=".."
                    className="inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 h-8 px-3 text-sm -ml-3 gap-2"
                >
                    <ArrowLeft size={16} /> Back to Locations
                </Link>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start gap-4 pb-6 border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex-1 w-full">
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => {
                            setName(e.target.value);
                            setIsDirty(true);
                            setSaveStatus(null);
                            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
                        }}
                        className="text-4xl font-bold text-zinc-900 dark:text-white mb-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-zinc-300 dark:placeholder-zinc-700 transition-colors hover:border-zinc-300 dark:hover:border-zinc-600 shadow-sm"
                        placeholder="Location Name"
                    />
                </div>
                <div className="flex gap-2 items-center flex-wrap justify-end">
                    {saveStatus === 'saving' && (
                        <span className="text-zinc-500 text-sm flex items-center gap-1">
                            <Loader2 className="animate-spin" size={14} /> Saving...
                        </span>
                    )}
                    {saveStatus === 'saved' && (
                        <span className="text-green-600 dark:text-green-400 text-sm flex items-center gap-1 font-medium transition-opacity duration-500">
                            Saved
                        </span>
                    )}
                    {saveStatus === 'error' && (
                        <span className="text-red-600 text-sm font-medium">
                            Error saving
                        </span>
                    )}
                    <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-800 mx-1"></div>
                    <Button onClick={handleImageUploadClick} disabled={isUploading || isGenerating} size="sm" variant="secondary">
                        {isUploading ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
                        {isUploading ? 'Uploading...' : 'Upload Image'}
                    </Button>
                    <Button onClick={handleGenerateImage} disabled={true} size="sm">
                        <Sparkles size={16} />
                        Generate Image
                    </Button>
                    <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-800 mx-1"></div>
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
                            <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Image</h3>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={onFileSelected}
                                className="hidden"
                                accept="image/*"
                            />
                        </div>

                        {(images && images.length > 0) ? (
                            <div className="grid grid-cols-1 gap-4">
                                {images.map((img, idx) => (
                                    <div key={idx} className="relative rounded-xl overflow-hidden group aspect-video bg-zinc-100 dark:bg-zinc-800">
                                        <img src={img} alt={`Location viz ${idx}`} className="w-full h-full object-cover" />
                                        <button
                                            onClick={() => handleDeleteImage(img)}
                                            className="absolute top-2 right-2 bg-black/60 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            thumbnailUrl ? (
                                <div className="rounded-xl overflow-hidden aspect-video bg-zinc-100 dark:bg-zinc-800 max-h-[400px]">
                                    <img
                                        src={thumbnailUrl}
                                        alt={name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/50">
                                    <Sparkles size={24} className="mb-2 opacity-20" />
                                    <p className="italic">No images generated yet.</p>
                                </div>
                            )
                        )}
                    </section>
                </div>

                {/* Right Side: Details */}
                <div className="flex flex-col gap-6">
                    <section className="flex flex-col gap-2">
                        <h3 className="font-semibold text-zinc-900 dark:text-white">Location Details</h3>
                        <div className="flex gap-4 text-zinc-500 items-center">
                            <MapPin size={16} className="shrink-0" />
                            <input
                                type="text"
                                value={geolocation}
                                onChange={(e) => {
                                    setGeolocation(e.target.value);
                                    setIsDirty(true);
                                    setSaveStatus(null);
                                    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
                                }}
                                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-md px-3 py-1.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-zinc-400 transition-colors hover:border-zinc-300 dark:hover:border-zinc-600 shadow-sm"
                                placeholder="Add geolocation..."
                            />
                            <select
                                value={type || ''}
                                onChange={(e) => {
                                    setType((e.target.value as LocationType) || undefined);
                                    setIsDirty(true);
                                    setSaveStatus(null);
                                    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
                                }}
                                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors hover:border-zinc-300 dark:hover-zinc-600 shadow-sm appearance-none font-medium text-zinc-700 dark:text-zinc-300"
                            >
                                <option value="">Select Type...</option>
                                <option value="INT.">INT.</option>
                                <option value="EXT.">EXT.</option>
                                <option value="INT./EXT.">INT./EXT.</option>
                            </select>
                        </div>
                    </section>

                    <section className="flex flex-col gap-2 flex-grow">
                        <h3 className="font-semibold text-zinc-900 dark:text-white">Description</h3>
                        <textarea
                            value={description}
                            onChange={(e) => {
                                setDescription(e.target.value);
                                setIsDirty(true);
                                setSaveStatus(null);
                                if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
                            }}
                            className="w-full p-3 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-zinc-300 dark:hover:border-zinc-600 transition-all min-h-[120px] resize-y shadow-sm flex-grow"
                            placeholder="Detailed description of the location..."
                        />
                    </section>

                    <section className="flex flex-col gap-2">
                        <h3 className="font-semibold text-zinc-900 dark:text-white">Notes</h3>
                        <textarea
                            value={comment}
                            onChange={(e) => {
                                setComment(e.target.value);
                                setIsDirty(true);
                                setSaveStatus(null);
                                if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
                            }}
                            className="w-full p-3 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-zinc-300 dark:hover:border-zinc-600 transition-all min-h-[120px] resize-y shadow-sm"
                            placeholder="Notes about lighting, access, etc."
                        />
                    </section>
                </div>
            </div>

            <section>
                <h3 className="font-semibold text-zinc-900 dark:text-white mb-4">Scenes ({associatedScenes.length})</h3>
                {associatedScenes.length > 0 ? (
                    <div className="grid gap-3">
                        {associatedScenes.map(scene => (
                            <div key={scene.id} onClick={() => navigate(`../../scenes/${scene.id}`)} className="flex items-center gap-4 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer transition-colors bg-white dark:bg-zinc-950/50">
                                <span className="font-mono font-bold text-zinc-400 w-8">{scene.number}</span>
                                <span className="font-medium text-zinc-900 dark:text-white">{scene.name}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-zinc-500 italic">No scenes linked to this location.</p>
                )}
            </section>
        </div>
    );
};
