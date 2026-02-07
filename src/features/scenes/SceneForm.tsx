import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../../hooks/useStore';
import { Input, TextArea } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import type { Scene } from '../../types/types';

export const SceneForm: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { scenes, addScene, locations } = useStore();

    const [formData, setFormData] = useState<Scene>({
        id: crypto.randomUUID(),
        number: '',
        name: '',
        description: '',
        comment: '',
        locationId: '',
    });

    useEffect(() => {
        if (id) {
            const existing = scenes.find((s) => s.id === id);
            if (existing) {
                setFormData(existing);
            }
        }
    }, [id, scenes]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        addScene(formData);
        navigate('/scenes');
    };

    return (
        <div className="max-w-2xl mx-auto w-full pt-8">
            <h2 className="text-3xl font-bold mb-8 text-zinc-900 dark:text-white">{id ? 'Edit Scene' : 'New Scene'}</h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-6 bg-white dark:bg-zinc-900 p-8 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <div className="flex gap-4">
                    <div className="w-24 flex-shrink-0">
                        <Input
                            name="number"
                            label="Scene #"
                            value={formData.number}
                            onChange={handleChange}
                            required
                            placeholder="1A"
                        />
                    </div>
                    <div className="flex-1">
                        <Input
                            name="name"
                            label="Scene Name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            placeholder="INTRO - EXT. STREET"
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-2 w-full">
                    <label htmlFor="locationId" className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Location</label>
                    <select
                        id="locationId"
                        name="locationId"
                        value={formData.locationId}
                        onChange={handleChange}
                        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-950/10 dark:focus:ring-white/10 focus:border-zinc-950 dark:focus:border-zinc-800 transition-colors w-full"
                        required
                    >
                        <option value="" disabled>Select a location</option>
                        {locations.map(loc => (
                            <option key={loc.id} value={loc.id}>
                                {loc.name}
                            </option>
                        ))}
                    </select>
                </div>

                <TextArea
                    name="description"
                    label="Description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    placeholder="What happens in this scene?"
                />

                <TextArea
                    name="comment"
                    label="Comments"
                    value={formData.comment}
                    onChange={handleChange}
                    rows={2}
                    placeholder="Production notes..."
                />

                <div className="flex justify-end gap-3 mt-4">
                    <Button type="button" variant="ghost" onClick={() => navigate('/scenes')}>
                        Cancel
                    </Button>
                    <Button type="submit">
                        Save Scene
                    </Button>
                </div>
            </form>
        </div>
    );
};
