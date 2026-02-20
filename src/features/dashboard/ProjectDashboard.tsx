import React from 'react';
import { useStore } from '../../hooks/useStore';
import { MapPin, Users, Clapperboard, Film, Video, Clock } from 'lucide-react';
import { useProjects } from '../../context/ProjectContext';

const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export const ProjectDashboard: React.FC = () => {
    const { locations, scenes, characters } = useStore();
    const { projects, activeProjectId } = useProjects();

    // Find active project name
    const activeProject = projects.find(p => p.id === activeProjectId);

    // Calculate stats
    const totalShots = scenes.reduce((total, scene) => total + (scene.shots?.length || 0), 0);
    const totalLength = scenes.reduce((total, scene) => {
        const sceneLength = (scene.shots || []).reduce((acc, shot) => acc + (shot.length || 0), 0);
        return total + sceneLength;
    }, 0);

    const stats = [
        {
            label: 'Locations',
            count: locations.length,
            icon: MapPin,
            color: 'text-blue-500 bg-blue-500/10'
        },
        {
            label: 'Scenes',
            count: scenes.length,
            icon: Clapperboard,
            color: 'text-purple-500 bg-purple-500/10'
        },
        {
            label: 'Characters',
            count: characters.length,
            icon: Users,
            color: 'text-green-500 bg-green-500/10'
        },
        {
            label: 'Shots',
            count: totalShots,
            icon: Video,
            color: 'text-orange-500 bg-orange-500/10'
        },
        {
            label: 'Total Length',
            count: formatTime(totalLength),
            icon: Clock,
            color: 'text-red-500 bg-red-500/10',
            isTime: true
        },
    ];

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">
                    {activeProject?.name || 'Project Dashboard'}
                </h1>
                <p className="text-zinc-500 dark:text-zinc-400 max-w-2xl">
                    {activeProject?.description || 'Overview and statistics'}
                </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
                {stats.map((stat) => (
                    <div key={stat.label} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex items-center justify-between shadow-sm">
                        <div>
                            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                                {stat.label}
                            </p>
                            <p className="text-2xl font-bold text-zinc-900 dark:text-white">
                                {stat.count}
                            </p>
                        </div>
                        <div className={`p-3 rounded-lg ${stat.color}`}>
                            <stat.icon size={20} />
                        </div>
                    </div>
                ))}
            </div>

            {/* Placeholder for future widgets or activity feed */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-8 text-center">
                    <Film className="mx-auto h-12 w-12 text-zinc-300 dark:text-zinc-700 mb-4" />
                    <h3 className="text-lg font-medium text-zinc-900 dark:text-white mb-2">Start Creating</h3>
                    <p className="text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
                        Use the sidebar to manage locations, characters, and scenes for your project.
                    </p>
                </div>
            </div>
        </div>
    );
};
