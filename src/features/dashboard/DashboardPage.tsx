import React from 'react';
import { useStore } from '../../hooks/useStore';
import { Card } from '../../components/ui/Card';
import { MapPin, Clapperboard, Film, Sparkles } from 'lucide-react';

export const DashboardPage: React.FC = () => {
    const { locations, scenes, shots } = useStore();

    // Calculate visualizations
    const visualisedShots = shots.filter(s => s.visualizationUrl).length;

    return (
        <div>
            <h2 className="text-3xl font-bold mb-8 text-zinc-900 dark:text-white">Dashboard</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center shrink-0 bg-blue-500/10 text-blue-500">
                        <MapPin size={32} />
                    </div>
                    <div>
                        <div className="text-4xl font-bold leading-none mb-1">{locations.length}</div>
                        <div className="text-zinc-500 dark:text-zinc-400 font-medium">Locations</div>
                    </div>
                </Card>

                <Card className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center shrink-0 bg-green-500/10 text-green-500">
                        <Clapperboard size={32} />
                    </div>
                    <div>
                        <div className="text-4xl font-bold leading-none mb-1">{scenes.length}</div>
                        <div className="text-zinc-500 dark:text-zinc-400 font-medium">Scenes</div>
                    </div>
                </Card>

                <Card className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center shrink-0 bg-purple-500/10 text-purple-500">
                        <Film size={32} />
                    </div>
                    <div>
                        <div className="text-4xl font-bold leading-none mb-1">{shots.length}</div>
                        <div className="text-zinc-500 dark:text-zinc-400 font-medium">Shots</div>
                    </div>
                </Card>

                <Card className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center shrink-0 bg-red-500/10 text-red-500">
                        <Sparkles size={32} />
                    </div>
                    <div>
                        <div className="text-4xl font-bold leading-none mb-1">{visualisedShots}</div>
                        <div className="text-zinc-500 dark:text-zinc-400 font-medium">Visualized</div>
                    </div>
                </Card>
            </div>

            <div className="mt-12">
                <h3 className="text-xl font-semibold mb-2 text-zinc-900 dark:text-white">Project Status</h3>
                <p className="text-zinc-500 dark:text-zinc-400">
                    Welcome to Kopfkino. Use the sidebar to navigate to Locations or Scenes to start building your film project.
                </p>
            </div>
        </div>
    );
};
