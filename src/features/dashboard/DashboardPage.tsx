import React, { useEffect, useState } from 'react';
import { useStore } from '../../hooks/useStore';
import { useAuth } from '../../context/AuthContext';
import { getImageCount } from '../../services/imageService';
import { Card } from '../../components/ui/Card';
import { MapPin, Clapperboard, Film, Image as ImageIcon, Users } from 'lucide-react';

export const DashboardPage: React.FC = () => {
    const { locations, scenes, characters } = useStore();
    const { user } = useAuth();
    const [imageCount, setImageCount] = useState<number | null>(null);

    useEffect(() => {
        const fetchImageCount = async () => {
            if (user) {
                const count = await getImageCount(user.uid);
                setImageCount(count);
            }
        };
        fetchImageCount();
    }, [user]);

    // Calculate visualizations
    const shots = scenes.flatMap(s => s.shots || []);

    return (
        <div>
            <h2 className="text-3xl font-bold mb-8 text-zinc-900 dark:text-white">Dashboard</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <Card className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center shrink-0 bg-zinc-500/10 text-zinc-500">
                        <MapPin size={32} />
                    </div>
                    <div>
                        <div className="text-4xl font-bold leading-none mb-1">{locations.length}</div>
                        <div className="text-zinc-500 dark:text-zinc-400 font-medium">Locations</div>
                    </div>
                </Card>

                <Card className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center shrink-0 bg-zinc-500/10 text-zinc-500">
                        <Users size={32} />
                    </div>
                    <div>
                        <div className="text-4xl font-bold leading-none mb-1">{characters.length}</div>
                        <div className="text-zinc-500 dark:text-zinc-400 font-medium">Characters</div>
                    </div>
                </Card>

                <Card className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center shrink-0 bg-zinc-500/10 text-zinc-500">
                        <Clapperboard size={32} />
                    </div>
                    <div>
                        <div className="text-4xl font-bold leading-none mb-1">{scenes.length}</div>
                        <div className="text-zinc-500 dark:text-zinc-400 font-medium">Scenes</div>
                    </div>
                </Card>

                <Card className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center shrink-0 bg-zinc-500/10 text-zinc-500">
                        <Film size={32} />
                    </div>
                    <div>
                        <div className="text-4xl font-bold leading-none mb-1">{shots.length}</div>
                        <div className="text-zinc-500 dark:text-zinc-400 font-medium">Shots</div>
                    </div>
                </Card>

                <Card className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center shrink-0 bg-zinc-500/10 text-zinc-500">
                        <ImageIcon size={32} />
                    </div>
                    <div>
                        <div className="text-4xl font-bold leading-none mb-1">
                            {imageCount === null ? '-' : imageCount}
                        </div>
                        <div className="text-zinc-500 dark:text-zinc-400 font-medium">Images</div>
                    </div>
                </Card>
            </div>

            <div className="mt-12">
                <h3 className="text-xl font-semibold mb-2 text-zinc-900 dark:text-white">Welcome</h3>
                <p className="text-zinc-500 dark:text-zinc-400">
                    Welcome to Kopfkino. Use the sidebar to navigate to Locations or Scenes to start building your film project.
                </p>
            </div>

            <div className="mt-12">
                <h3 className="text-xl font-semibold mb-2 text-zinc-900 dark:text-white">Version</h3>
                <p className="text-zinc-500 dark:text-zinc-400">
                    Current version
                </p>
                <p className="text-zinc-500 dark:text-zinc-400">
                    v0.1
                </p>
            </div>
        </div>
    );
};
