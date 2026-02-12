import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../../hooks/useStore';
import { Input, TextArea } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import type { Scene } from '../../types/types';

export const SceneForm: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { scenes, addScene, locations, characters } = useStore();

    const [formData, setFormData] = useState<Scene>({
        id: crypto.randomUUID(),
        number: '',
        name: '',
        description: '',
        comment: '',
        locationId: '',
        characters: [],
        shots: [], // Initialize shots
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

    const toggleCharacter = (characterId: string) => {
        setFormData(prev => {
            const current = prev.characters || [];
            if (current.includes(characterId)) {
                return { ...prev, characters: current.filter(id => id !== characterId) };
            } else {
                return { ...prev, characters: [...current, characterId] };
            }
        });
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

                <div className="flex flex-col gap-2 w-full">
                    <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Characters</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                        {characters.map(char => {
                            const isSelected = formData.characters?.includes(char.id);
                            return (
                                <div
                                    key={char.id}
                                    onClick={() => toggleCharacter(char.id)}
                                    className={`
                                        cursor-pointer rounded-lg border p-2 flex items-center gap-3 transition-all
                                        ${isSelected
                                            ? 'border-zinc-900 bg-zinc-50 dark:border-white dark:bg-zinc-800'
                                            : 'border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700'}
                                    `}
                                >
                                    <div className="w-8 h-8 rounded bg-zinc-100 dark:bg-zinc-800 flex-shrink-0 overflow-hidden">
                                        {char.imageUrl ? (
                                            <img src={char.imageUrl} alt={char.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-zinc-400">
                                                <span className="text-xs">?</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium truncate text-zinc-900 dark:text-zinc-100">{char.name}</p>
                                    </div>
                                </div>
                            );
                        })}
                        {characters.length === 0 && (
                            <div className="col-span-full text-center py-4 text-zinc-500 text-sm italic">
                                No characters available. Create some characters first.
                            </div>
                        )}
                    </div>
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
