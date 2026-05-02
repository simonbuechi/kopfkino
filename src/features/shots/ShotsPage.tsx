import React, { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../../hooks/useStore';
import { PageHeader } from '../../components/ui/PageHeader';
import { ShotsList } from './ShotsList';
import { Button } from '../../components/ui/Button';
import { Clapperboard, Film } from 'lucide-react';
import clsx from 'clsx';

const selectClass = clsx(
    "bg-white dark:bg-primary-950 border border-primary-300 dark:border-primary-700 rounded-lg px-3 py-2",
    "text-sm text-primary-900 dark:text-primary-100",
    "focus:outline-none focus:ring-2 focus:ring-primary-600/20 dark:focus:ring-primary-400/20 focus:border-primary-600 dark:focus:border-primary-400",
    "transition-colors min-w-[260px]"
);

export const ShotsPage: React.FC = () => {
    const { projectId, id: sceneIdFromUrl } = useParams<{ projectId: string; id?: string }>();
    const { scenes, updateSceneGroups } = useStore();
    const navigate = useNavigate();

    const sortedScenes = [...scenes].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const selectedSceneId = sceneIdFromUrl ?? '';
    const selectedScene = sortedScenes.find(s => s.id === selectedSceneId);

    const sceneShots = useMemo(() => selectedScene?.shots ?? [], [selectedScene]);
    const sceneGroups = useMemo(() => selectedScene?.groups ?? [], [selectedScene]);

    const handleSceneChange = (sceneId: string) => {
        if (sceneId) {
            navigate(`/project/${projectId}/scenes/${sceneId}/shots`);
        } else {
            navigate(`/project/${projectId}/scenes/shots`);
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Shots"
                actions={
                    <div className="flex items-center gap-3">
                        {selectedScene && (
                            <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => navigate(`/project/${projectId}/scenes/${selectedSceneId}`)}
                            >
                                <Film size={14} />
                                Go to Scene
                            </Button>
                        )}
                        <Film size={16} className="text-primary-400" />
                        <select
                            value={selectedSceneId}
                            onChange={e => handleSceneChange(e.target.value)}
                            className={selectClass}
                        >
                            <option value="">Select a scene…</option>
                            {sortedScenes.map(scene => (
                                <option key={scene.id} value={scene.id}>
                                    {scene.number ? `${scene.number} – ` : ''}{scene.name}
                                </option>
                            ))}
                        </select>
                    </div>
                }
            />

            {!selectedScene ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <Clapperboard size={40} className="text-primary-300 dark:text-primary-700 mb-4" />
                    <p className="text-primary-500 dark:text-primary-400 text-sm font-medium">
                        Select a scene above to view its shots.
                    </p>
                </div>
            ) : (
                <ShotsList
                    sceneId={selectedSceneId}
                    shots={sceneShots}
                    groups={sceneGroups}
                    scenePlannedLength={selectedScene.length}
                    onSetupsChange={(groups) => updateSceneGroups(selectedSceneId, groups)}
                    onAddShot={() => navigate(`/project/${projectId}/scenes/${selectedSceneId}/shots/new`)}
                    onEditShot={(id) => navigate(`/project/${projectId}/scenes/${selectedSceneId}/shots/${id}`)}
                />
            )}
        </div>
    );
};
