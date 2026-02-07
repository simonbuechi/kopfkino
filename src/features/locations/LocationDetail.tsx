import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../../hooks/useStore';
import { Button } from '../../components/ui/Button';
import { MapPin, Edit, Trash2, ArrowLeft, Sparkles, Loader2, X } from 'lucide-react';
import { generateImage } from '../../services/ai';
import { uploadImageFromUrl, deleteImageFromUrl } from '../../services/imageService';
import { useAuth } from '../../context/AuthContext';

export const LocationDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { locations, deleteLocation, addLocation, scenes, settings } = useStore();
    const { user } = useAuth();
    const [isGenerating, setIsGenerating] = useState(false);

    const location = locations.find((l) => l.id === id);
    const associatedScenes = scenes.filter(s => s.locationId === id);

    if (!location) {
        return <div className="p-8">Location not found</div>;
    }

    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this location?')) {
            deleteLocation(location.id);
            navigate('/locations');
        }
    };

    const handleGenerateImage = async () => {
        if (!user) return;
        setIsGenerating(true);
        const prompt = `Cinematic location concept art: ${location.name}. 
        Description: ${location.description}. 
        Geolocation/Context: ${location.geolocation}. 
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
            const tempUrl = await generateImage(prompt, "AIzaSyAmN_b7G1HI1YvtFEMRk6y9neHpYuH2DA8", options);

            // 2. Upload to Firebase Storage
            const permanentUrl = await uploadImageFromUrl(tempUrl, user.uid);

            // 3. Update Firestore with new persistent URL
            const updatedImages = [...(location.images || []), permanentUrl];

            addLocation({
                ...location,
                images: updatedImages,
                thumbnailUrl: location.thumbnailUrl || permanentUrl
            });
        } catch (error) {
            console.error("Failed to generate or upload image", error);
            alert("Failed to generate image. Ensure popups are allowed if Auth is pending, or check console.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDeleteImage = async (imageUrl: string) => {
        if (confirm('Delete this image?')) {
            // 1. Remove from local state/Firestore immediately for UI responsiveness
            const updatedImages = (location.images || []).filter(img => img !== imageUrl);
            addLocation({
                ...location,
                images: updatedImages,
                thumbnailUrl: location.thumbnailUrl === imageUrl ? (updatedImages[0] || '') : location.thumbnailUrl
            });

            // 2. Delete from Storage (fire and forget from UI perspective)
            await deleteImageFromUrl(imageUrl);
        }
    };

    return (
        <div className="flex flex-col gap-8 w-full max-w-5xl mx-auto">
            <div>
                <Button variant="ghost" onClick={() => navigate('/locations')} size="sm" className="-ml-3 text-zinc-500">
                    <ArrowLeft size={16} /> Back to Locations
                </Button>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start gap-4 pb-6 border-b border-zinc-200 dark:border-zinc-800">
                <div>
                    <h1 className="text-4xl font-bold text-zinc-900 dark:text-white mb-2">{location.name}</h1>
                    <div className="flex gap-4 text-zinc-500">
                        {location.geolocation && (
                            <div className="flex items-center gap-1.5 text-sm">
                                <MapPin size={16} />
                                {location.geolocation}
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => navigate('edit')} size="sm">
                        <Edit size={16} /> Edit
                    </Button>
                    <Button variant="danger" onClick={handleDelete} size="sm">
                        <Trash2 size={16} /> Delete
                    </Button>
                </div>
            </div>

            <div className="grid gap-12">
                <div className="space-y-6">
                    <section>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Visualizations</h3>
                            <Button onClick={handleGenerateImage} disabled={isGenerating} size="sm">
                                {isGenerating ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
                                {isGenerating ? 'Generating...' : 'Generate Image'}
                            </Button>
                        </div>

                        {(location.images && location.images.length > 0) ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {location.images.map((img, idx) => (
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
                            location.thumbnailUrl ? (
                                <div className="rounded-xl overflow-hidden aspect-video bg-zinc-100 dark:bg-zinc-800 max-h-[400px]">
                                    <img
                                        src={location.thumbnailUrl}
                                        alt={location.name}
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

                <div className="grid md:grid-cols-2 gap-8">
                    <section>
                        <h3 className="font-semibold text-zinc-900 dark:text-white mb-2">Description</h3>
                        <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed whitespace-pre-line">{location.description || 'No description provided.'}</p>
                    </section>

                    <section>
                        <h3 className="font-semibold text-zinc-900 dark:text-white mb-2">Comments</h3>
                        <p className="text-zinc-600 dark:text-zinc-300 whitespace-pre-line">{location.comment || 'No comments.'}</p>
                    </section>
                </div>

                <section>
                    <h3 className="font-semibold text-zinc-900 dark:text-white mb-4">Scenes ({associatedScenes.length})</h3>
                    {associatedScenes.length > 0 ? (
                        <div className="grid gap-3">
                            {associatedScenes.map(scene => (
                                <div key={scene.id} onClick={() => navigate(`/scenes/${scene.id}`)} className="flex items-center gap-4 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer transition-colors bg-white dark:bg-zinc-950/50">
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
        </div>
    );
};
