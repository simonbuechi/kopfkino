import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../../hooks/useStore';
import { Input, TextArea } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import type { Shot } from '../../types/types';

export const ShotForm: React.FC = () => {
    // We expect the URL to be /scenes/:sceneId/shots/new or /scenes/:sceneId/shots/:shotId/edit
    const { id: sceneId, shotId } = useParams<{ id: string, shotId?: string }>();
    const navigate = useNavigate();
    const { scenes, addShotToScene, updateShotInScene } = useStore();

    const scene = scenes.find(s => s.id === sceneId);

    const [formData, setFormData] = useState<Shot>({
        id: crypto.randomUUID(),
        // number: '', // Removed
        name: '',
        description: `Size: (full, medium, close-up)
Angle: (eye, shoulder, hip, dutch)
Framing: (single, two, three, over-the-shoulder, point-of-view)
Movement: (static, tracking, dolly, pan, tilt, zoom)
Focus: (shallow, deep)`,
        visualizationUrl: '',
        length: 0,
        audio: true,
    });

    useEffect(() => {
        if (shotId && scene && scene.shots) {
            const existing = scene.shots.find((s) => s.id === shotId);
            if (existing) {
                setFormData(existing);
            }
        }
    }, [shotId, scene]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!sceneId) return;

        if (shotId) {
            await updateShotInScene(sceneId, formData);
        } else {
            await addShotToScene(sceneId, formData);
        }
        navigate(`/scenes/${sceneId}`);
    };

    if (!scene) return <div className="p-8">Scene not found</div>;

    return (
        <div className="max-w-2xl mx-auto w-full pt-8">
            <h2 className="text-2xl font-bold mb-6 text-zinc-900 dark:text-white">
                {shotId ? 'Edit Shot' : 'New Shot'} <span className="text-zinc-400 font-normal text-lg ml-2">for Scene {scene.number}</span>
            </h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-6 bg-white dark:bg-zinc-900 p-8 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <div className="flex gap-4">
                    <div className="flex-1">
                        <Input
                            name="name"
                            label="Shot Type / Name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            placeholder="Close Up"
                        />
                    </div>
                </div>

                <div className="w-32">
                    <Input
                        name="length"
                        label="Length (s)"
                        type="number"
                        value={formData.length || ''}
                        onChange={handleChange}
                        placeholder="Seconds"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="audio"
                        name="audio"
                        checked={formData.audio ?? true}
                        onChange={(e) => setFormData(prev => ({ ...prev, audio: e.target.checked }))}
                        className="w-4 h-4 text-zinc-900 bg-gray-100 border-gray-300 rounded focus:ring-zinc-900 dark:focus:ring-zinc-600 dark:ring-offset-zinc-800 focus:ring-2 dark:bg-zinc-700 dark:border-zinc-600"
                    />
                    <label htmlFor="audio" className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        Has Audio
                    </label>
                </div>

                <TextArea
                    name="description"
                    label="Description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={7}
                    placeholder="Visual description of the shot..."
                />

                <div className="flex justify-end gap-3 mt-4">
                    <Button type="button" variant="ghost" onClick={() => navigate(`/scenes/${sceneId}`)}>
                        Cancel
                    </Button>
                    <Button type="submit">
                        Save Shot
                    </Button>
                </div>
            </form>
        </div>
    );
};
