import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../hooks/useStore';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Edit, Trash2, Plus, Sparkles, Image as ImageIcon, Loader2 } from 'lucide-react';
import { generateImage } from '../../services/ai';
import type { Shot } from '../../types/types';

interface ShotsListProps {
    sceneId: string;
}

export const ShotsList: React.FC<ShotsListProps> = ({ sceneId }) => {
    const { shots, deleteShot, updateShot, scenes, locations } = useStore();
    const navigate = useNavigate();
    const [generatingId, setGeneratingId] = useState<string | null>(null);

    const sceneShots = shots.filter((s) => s.sceneId === sceneId);
    const scene = scenes.find(s => s.id === sceneId);

    // Need location description for better prompting
    const location = locations.find(l => l.id === scene?.locationId);

    const handleDelete = (id: string) => {
        if (confirm('Delete this shot?')) {
            deleteShot(id);
        }
    };

    const handleGenerate = async (shot: Shot) => {
        if (!scene) return;
        setGeneratingId(shot.id);

        // Construct a rich prompt
        const prompt = `Cinematic shot, ${shot.name}. 
    Subject: ${shot.description}. 
    Scene Context: ${scene.description}. 
    Location: ${location?.name}, ${location?.description} (${location?.geolocation}). 
    Mood/Style: Cinematic, high quality, 8k, photorealistic.`;

        try {
            const url = await generateImage(prompt, "AIzaSyAmN_b7G1HI1YvtFEMRk6y9neHpYuH2DA8"); // Using provided key
            updateShot({ ...shot, visualizationUrl: url });
        } catch (e) {
            console.error("Generation failed", e);
            alert("Failed to generate image.");
        } finally {
            setGeneratingId(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Shots List</h3>
                <Button size="sm" onClick={() => navigate(`shots/new`)}>
                    <Plus size={16} /> Add Shot
                </Button>
            </div>

            <div className="flex flex-col gap-6">
                {sceneShots.length === 0 ? (
                    <p className="text-zinc-500 italic">No shots yet.</p>
                ) : (
                    sceneShots.map(shot => (
                        <Card key={shot.id} className="flex flex-col p-0 overflow-hidden">
                            <div className="flex flex-col md:flex-row">
                                {/* Visualization Column */}
                                <div className="w-full md:w-1/3 bg-zinc-100 dark:bg-zinc-800 relative group min-h-[200px]">
                                    {shot.visualizationUrl ? (
                                        <>
                                            <img src={shot.visualizationUrl} alt={shot.description} className="w-full h-full object-cover absolute inset-0" />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-end justify-end p-2 opacity-0 group-hover:opacity-100">
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    className="shadow-lg backdrop-blur-md bg-white/90 dark:bg-black/80"
                                                    onClick={() => handleGenerate(shot)}
                                                    disabled={generatingId === shot.id}
                                                >
                                                    {generatingId === shot.id ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />}
                                                    <span className="ml-2">Regenerate</span>
                                                </Button>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="w-full h-full min-h-[240px] flex flex-col items-center justify-center p-6 text-zinc-400 gap-4">
                                            <ImageIcon size={48} className="opacity-20" />
                                            <p className="text-sm font-medium">No visualization</p>
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                onClick={() => handleGenerate(shot)}
                                                disabled={generatingId === shot.id}
                                            >
                                                {generatingId === shot.id ? (
                                                    <Loader2 size={14} className="animate-spin" />
                                                ) : (
                                                    <Sparkles size={14} />
                                                )}
                                                Generate AI Visualization
                                            </Button>
                                        </div>
                                    )}
                                </div>

                                {/* Content Column */}
                                <div className="flex-1 p-6 flex flex-col">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <span className="inline-flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-bold px-2 py-1 rounded text-sm min-w-[2rem]">
                                                {shot.number}
                                            </span>
                                            <strong className="text-lg text-zinc-900 dark:text-white">{shot.name}</strong>
                                        </div>
                                        <div className="flex gap-1 ml-4">
                                            <Button size="sm" variant="ghost" onClick={() => navigate(`shots/${shot.id}/edit`)} className="h-8 w-8 p-0">
                                                <Edit size={14} />
                                            </Button>
                                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => handleDelete(shot.id)}>
                                                <Trash2 size={14} />
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="prose prose-sm dark:prose-invert max-w-none text-zinc-600 dark:text-zinc-300">
                                        <p>{shot.description}</p>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
};
