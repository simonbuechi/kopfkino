import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../hooks/useStore';
import { MapPin, Users, Clapperboard, Video, Clock, ExternalLink, Plus } from 'lucide-react';
import { useProjects } from '../../context/ProjectContext';

const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export const ProjectDashboard: React.FC = () => {
    const { locations, scenes, characters } = useStore();
    const { projects, activeProjectId } = useProjects();
    const navigate = useNavigate();

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
            color: 'text-blue-500 bg-blue-500/10',
            action: { label: 'Create location', path: 'locations/new' }
        },
        {
            label: 'Scenes',
            count: scenes.length,
            icon: Clapperboard,
            color: 'text-purple-500 bg-purple-500/10',
            action: { label: 'Create scene', path: 'scenes/new' }
        },
        {
            label: 'Characters',
            count: characters.length,
            icon: Users,
            color: 'text-green-500 bg-green-500/10',
            action: { label: 'Create character', path: 'characters/new' }
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
                <p className="text-zinc-500 dark:text-zinc-400 max-w-2xl mb-4">
                    {activeProject?.description || 'Overview and statistics'}
                </p>
                {activeProject?.url && (
                    <a
                        href={activeProject.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors border border-zinc-200 dark:border-zinc-700"
                    >
                        <ExternalLink size={14} />
                        {activeProject.url.replace(/^https?:\/\//, '')}
                    </a>
                )}
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
                {stats.map((stat) => (
                    <div key={stat.label} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex flex-col shadow-sm group">
                        <div className="flex justify-between items-start mb-4">
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
                        {stat.action ? (
                            <button
                                onClick={() => navigate(stat.action!.path)}
                                className="flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-md bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-sm font-medium text-zinc-600 dark:text-zinc-300 transition-colors border border-zinc-200 dark:border-zinc-700 mt-auto"
                            >
                                <Plus size={16} />
                                {stat.action.label}
                            </button>
                        ) : (
                            <div className="h-9 mt-auto"></div> // Placeholder to maintain consistent height
                        )}
                    </div>
                ))}
            </div>

        </div>
    );
};
