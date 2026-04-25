import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../hooks/useStore';
import { MapPin, Users, Clapperboard, Video, ExternalLink, Plus, Eye, FileText, ArrowRight } from 'lucide-react';
import { useProjects } from '../../hooks/useProjects';
import { formatTime } from '../../utils/time';
import { isSafeUrl } from '../../utils/url';
import { StatCard, StatCardAction } from '../../components/ui/StatCard';

const CHARS_PER_LINE = 60;
const LINES_PER_PAGE = 55;

function countScriptPages(content: string): number {
    const chars = content.length;
    const lines = Math.ceil(chars / CHARS_PER_LINE);
    return Math.max(1, Math.ceil(lines / LINES_PER_PAGE));
}

export const ProjectDashboard: React.FC = () => {
    const { locations, scenes, characters, script } = useStore();
    const { activeProject, activeProjectRole } = useProjects();
    const navigate = useNavigate();

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
            color: 'text-accent-500 bg-accent-500/10',
            action: { label: 'Create location', path: 'locations/new' }
        },
        {
            label: 'Scenes',
            count: scenes.length,
            icon: Clapperboard,
            color: 'text-primary-500 bg-primary-500/10',
            action: { label: 'Create scene', path: 'scenes/new' }
        },
        {
            label: 'Characters',
            count: characters.length,
            icon: Users,
            color: 'text-primary-400 bg-primary-400/10',
            action: { label: 'Create character', path: 'characters/new' }
        },
        {
            label: 'Shots',
            count: totalShots,
            subCount: `totalling to ${formatTime(totalLength)}`,
            icon: Video,
            color: 'text-accent-400 bg-accent-400/10'
        }
    ];

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {activeProjectRole === 'viewer' && (
                <div className="mb-6 flex items-center gap-2 px-4 py-3 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-600 dark:text-zinc-400">
                    <Eye size={16} className="shrink-0" />
                    You have read-only access to this project. Contact the owner to request edit permissions.
                </div>
            )}
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-primary-900 dark:text-white mb-2">
                    {activeProject?.name || 'Project Dashboard'}
                </h1>
                <p className="text-primary-500 dark:text-primary-400 max-w-2xl mb-4">
                    {activeProject?.description || 'Overview and statistics'}
                </p>
                {activeProject?.url && isSafeUrl(activeProject.url) && (
                    <a
                        href={activeProject.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold bg-primary-100 dark:bg-primary-800 text-primary-700 dark:text-primary-300 hover:bg-primary-200 dark:hover:bg-primary-700 transition-colors border border-primary-200 dark:border-primary-700"
                    >
                        <ExternalLink size={14} />
                        {activeProject.url.replace(/^https?:\/\//, '')}
                    </a>
                )}
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
                {stats.map((stat) => (
                    <StatCard
                        key={stat.label}
                        label={stat.label}
                        count={stat.count}
                        subCount={stat.subCount}
                        icon={<stat.icon size={20} />}
                        iconClassName={stat.color}
                        action={stat.action && activeProjectRole !== 'viewer'
                            ? <StatCardAction onClick={() => navigate(stat.action!.path)} icon={<Plus size={16} />} label={stat.action.label} />
                            : undefined
                        }
                    />
                ))}

                {script?.content?.trim() && (
                    <StatCard
                        label="Script"
                        count={countScriptPages(script.content)}
                        subCount="pages"
                        icon={<FileText size={20} />}
                        iconClassName="text-primary-500 bg-primary-500/10"
                        action={<StatCardAction onClick={() => navigate('script')} icon={<ArrowRight size={16} />} label="Open script" />}
                    />
                )}
            </div>

        </div>
    );
};
