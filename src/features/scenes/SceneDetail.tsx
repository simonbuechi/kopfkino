import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../../hooks/useStore';
import { Button } from '../../components/ui/Button';
import { Edit, Trash2, ArrowLeft, MapPin } from 'lucide-react';
import { ShotsList } from '../shots/ShotsList';

export const SceneDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { scenes, deleteScene, locations } = useStore();

    const scene = scenes.find((s) => s.id === id);
    const location = locations.find(l => l.id === scene?.locationId);

    if (!scene) {
        return <div className="p-8">Scene not found</div>;
    }

    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this scene?')) {
            deleteScene(scene.id);
            navigate('/scenes');
        }
    };

    return (
        <div className="flex flex-col gap-8 w-full max-w-5xl mx-auto">
            <div>
                <Button variant="ghost" onClick={() => navigate('/scenes')} size="sm" className="-ml-3 text-zinc-500">
                    <ArrowLeft size={16} /> Back to Scenes
                </Button>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start gap-4 pb-6 border-b border-zinc-200 dark:border-zinc-800">
                <div>
                    <div className="text-sm font-bold text-zinc-500 tracking-wider mb-1">
                        SCENE {scene.number}
                    </div>
                    <h1 className="text-4xl font-bold text-zinc-900 dark:text-white mb-2">{scene.name}</h1>
                    <div className="flex gap-4 text-zinc-500">
                        {location && (
                            <div className="flex items-center gap-1.5 text-sm">
                                <MapPin size={16} />
                                {location.name}
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
                <div className="grid md:grid-cols-2 gap-8">
                    <section>
                        <h3 className="font-semibold text-zinc-900 dark:text-white mb-2">Description</h3>
                        <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed whitespace-pre-line">{scene.description || 'No description.'}</p>
                    </section>

                    <section>
                        <h3 className="font-semibold text-zinc-900 dark:text-white mb-2">Production Notes</h3>
                        <p className="text-zinc-600 dark:text-zinc-300 whitespace-pre-line">{scene.comment || 'No notes.'}</p>
                    </section>
                </div>

                <section>
                    <ShotsList sceneId={scene.id} />
                </section>
            </div>
        </div>
    );
};
