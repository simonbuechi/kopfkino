import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../../hooks/useStore';
import { useProjects } from '../../context/ProjectContext';
import { Input, TextArea } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import type { Location } from '../../types/types';

export const LocationForm: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { locations, addLocation } = useStore();
    const { activeProjectId } = useProjects();

    const [formData, setFormData] = useState<Location>({
        id: crypto.randomUUID(),
        projectId: activeProjectId || '',
        name: '',
        description: '',
        geolocation: '',
        comment: '',
        thumbnailUrl: '',
    });

    useEffect(() => {
        if (id) {
            const existing = locations.find((l) => l.id === id);
            if (existing) {
                setFormData(existing);
            }
        }
    }, [id, locations]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        addLocation(formData);
        navigate('..');
    };

    return (
        <div className="max-w-2xl mx-auto w-full">
            <h2 className="text-3xl font-bold mb-8 text-zinc-900 dark:text-white">{id ? 'Edit Location' : 'New Location'}</h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-6 bg-white dark:bg-zinc-900 p-8 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <Input
                    name="name"
                    label="Name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="e.g. Abandoned Warehouse"
                />
                <TextArea
                    name="description"
                    label="Description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Detailed description of the location..."
                />
                <Input
                    name="geolocation"
                    label="Geolocation / Address"
                    value={formData.geolocation}
                    onChange={handleChange}
                    placeholder="40.7128° N, 74.0060° W"
                />
                <TextArea
                    name="comment"
                    label="Comments"
                    value={formData.comment}
                    onChange={handleChange}
                    rows={2}
                    placeholder="Notes about lighting, access, etc."
                />
                {/* Placeholder for real file upload or URL */}
                <Input
                    name="thumbnailUrl"
                    label="Thumbnail URL"
                    value={formData.thumbnailUrl}
                    onChange={handleChange}
                    placeholder="https://example.com/image.jpg"
                />

                <div className="flex justify-end gap-3 mt-4">
                    <Button type="button" variant="ghost" onClick={() => navigate('..')}>
                        Cancel
                    </Button>
                    <Button type="submit">
                        Save Location
                    </Button>
                </div>
            </form>
        </div>
    );
};
