import React, { useRef, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../hooks/useStore';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Clapperboard, Plus, MapPin, Upload, Download } from 'lucide-react';
import type { Scene, Shot } from '../../types/types';

export const SceneList: React.FC = () => {
    const { scenes, locations, shots, replaceScenes, replaceShots } = useStore();
    const navigate = useNavigate();
    const sceneFileInputRef = useRef<HTMLInputElement>(null);
    const shotFileInputRef = useRef<HTMLInputElement>(null);

    const getLocationName = (id: string) => {
        return locations.find(l => l.id === id)?.name || 'Unknown Location';
    };

    // --- SCENES IMPORT/EXPORT ---
    const handleImportScenesClick = () => {
        if (confirm('WARNING: Importing Scenes will PERMANENTLY DELETE all existing scenes. Proceed?')) {
            sceneFileInputRef.current?.click();
        }
    };

    const handleSceneFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            if (!text) return;
            try {
                const lines = text.split('\n');
                const newScenes: Scene[] = [];
                let startIndex = 0;
                if (lines[0].toLowerCase().includes('number')) startIndex = 1;

                for (let i = startIndex; i < lines.length; i++) {
                    const line = lines[i].trim();
                    if (!line) continue;
                    const parts = line.split(',');
                    if (parts.length < 2) continue;

                    newScenes.push({
                        id: crypto.randomUUID(),
                        number: parts[0]?.trim() || '',
                        name: parts[1]?.trim() || 'Untitled',
                        description: parts[2]?.trim() || '',
                        comment: parts[3]?.trim(),
                        locationId: parts[4]?.trim() || ''
                    });
                }
                if (newScenes.length > 0) {
                    replaceScenes(newScenes);
                    alert(`Imported ${newScenes.length} scenes.`);
                }
            } catch (err) {
                console.error(err);
                alert('Failed to parse scenes CSV.');
            }
            if (sceneFileInputRef.current) sceneFileInputRef.current.value = '';
        };
        reader.readAsText(file);
    };

    const handleExportScenes = () => {
        if (scenes.length === 0) return alert('No scenes to export.');
        const headers = ["Number", "Name", "Description", "Comment", "LocationId"];
        const csv = [
            headers.join(','),
            ...scenes.map(s => [
                s.number,
                `"${s.name.replace(/"/g, '""')}"`,
                `"${s.description.replace(/"/g, '""')}"`,
                `"${(s.comment || '').replace(/"/g, '""')}"`,
                s.locationId
            ].join(','))
        ].join('\n');
        downloadCsv(csv, 'kopfkino_scenes.csv');
    };

    // --- SHOTS IMPORT/EXPORT ---
    const handleImportShotsClick = () => {
        if (confirm('WARNING: Importing Shots will PERMANENTLY DELETE all existing shots. Proceed?')) {
            shotFileInputRef.current?.click();
        }
    };

    const handleShotFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            if (!text) return;
            try {
                const lines = text.split('\n');
                const newShots: Shot[] = [];
                let startIndex = 0;
                if (lines[0].toLowerCase().includes('number')) startIndex = 1;

                for (let i = startIndex; i < lines.length; i++) {
                    const line = lines[i].trim();
                    if (!line) continue;
                    const parts = line.split(',');
                    if (parts.length < 2) continue;

                    newShots.push({
                        id: crypto.randomUUID(),
                        sceneId: parts[0]?.trim() || '',
                        number: parts[1]?.trim() || '',
                        name: parts[2]?.trim() || '',
                        description: parts[3]?.trim() || '',
                        visualizationUrl: parts[4]?.trim()
                    });
                }
                if (newShots.length > 0) {
                    replaceShots(newShots);
                    alert(`Imported ${newShots.length} shots.`);
                }
            } catch (err) {
                console.error(err);
                alert('Failed to parse shots CSV.');
            }
            if (shotFileInputRef.current) shotFileInputRef.current.value = '';
        };
        reader.readAsText(file);
    };

    const handleExportShots = () => {
        if (shots.length === 0) return alert('No shots to export.');
        const headers = ["SceneId", "Number", "Name", "Description", "VisualizationUrl"];
        const csv = [
            headers.join(','),
            ...shots.map(s => [
                s.sceneId,
                s.number,
                `"${s.name.replace(/"/g, '""')}"`,
                `"${s.description.replace(/"/g, '""')}"`,
                s.visualizationUrl || ''
            ].join(','))
        ].join('\n');
        downloadCsv(csv, 'kopfkino_shots.csv');
    };

    const downloadCsv = (content: string, filename: string) => {
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-3xl font-bold text-zinc-900 dark:text-white">Scenes</h2>
                <div className="flex flex-col gap-3 items-end">
                    <div className="flex flex-wrap gap-2 justify-end">
                        <input type="file" accept=".csv" ref={sceneFileInputRef} className="hidden" onChange={handleSceneFileChange} />
                        <input type="file" accept=".csv" ref={shotFileInputRef} className="hidden" onChange={handleShotFileChange} />

                        <Button variant="secondary" size="sm" onClick={handleImportScenesClick}>
                            <Upload size={14} /> Import Scenes
                        </Button>
                        <Button variant="secondary" size="sm" onClick={handleExportScenes}>
                            <Download size={14} /> Export Scenes
                        </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 justify-end">
                        <Button variant="secondary" size="sm" onClick={handleImportShotsClick}>
                            <Upload size={14} /> Import Shots
                        </Button>
                        <Button variant="secondary" size="sm" onClick={handleExportShots}>
                            <Download size={14} /> Export Shots
                        </Button>
                        <Button onClick={() => navigate('new')} size="sm">
                            <Plus size={16} /> New Scene
                        </Button>
                    </div>
                </div>
            </div>

            {scenes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-zinc-500 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                    <Clapperboard size={48} className="mb-4 opacity-50" />
                    <p>No scenes yet. Create your first one!</p>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {scenes.map((scene) => (
                        <Card
                            key={scene.id}
                            hoverable
                            className="flex flex-col sm:flex-row p-6 gap-6 items-start sm:items-center cursor-pointer"
                            onClick={() => navigate(scene.id)}
                        >
                            <div className="text-2xl font-bold text-zinc-900 dark:text-white min-w-[60px] text-center font-mono">
                                {scene.number}
                            </div>
                            <div className="flex-1 space-y-2">
                                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">{scene.name}</h3>
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                                    <MapPin size={12} />
                                    {getLocationName(scene.locationId)}
                                </div>
                                <p className="text-zinc-500 dark:text-zinc-400 text-sm line-clamp-1">
                                    {scene.description?.substring(0, 100)}...
                                </p>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};
