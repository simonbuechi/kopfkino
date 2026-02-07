import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../hooks/useStore';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { MapPin, Plus, Upload, Download } from 'lucide-react';
import type { Location } from '../../types/types';

export const LocationList: React.FC = () => {
    const { locations, replaceLocations } = useStore();
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImportClick = () => {
        if (confirm('WARNING: Importing a CSV file will PERMANENTLY DELETE all existing locations. Do you want to proceed?')) {
            fileInputRef.current?.click();
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            if (!text) return;

            try {
                const lines = text.split('\n');
                const newLocations: Location[] = [];
                let startIndex = 0;
                if (lines[0].toLowerCase().includes('name')) {
                    startIndex = 1;
                }

                for (let i = startIndex; i < lines.length; i++) {
                    const line = lines[i].trim();
                    if (!line) continue;
                    const parts = line.split(',');
                    if (parts.length < 2) continue;
                    const name = parts[0]?.trim();
                    const description = parts[1]?.trim() || '';
                    const geolocation = parts[2]?.trim();
                    const comment = parts[3]?.trim();

                    if (name) {
                        newLocations.push({
                            id: crypto.randomUUID(),
                            name,
                            description,
                            geolocation: geolocation || undefined,
                            comment: comment || undefined,
                        });
                    }
                }

                if (newLocations.length > 0) {
                    replaceLocations(newLocations);
                    alert(`Successfully imported ${newLocations.length} locations.`);
                } else {
                    alert("No valid locations found in CSV.");
                }
            } catch (error) {
                console.error("Import failed:", error);
                alert("Failed to parse CSV file.");
            }
            if (fileInputRef.current) fileInputRef.current.value = '';
        };
        reader.readAsText(file);
    };

    const handleExportClick = () => {
        if (locations.length === 0) {
            alert("No locations to export.");
            return;
        }

        const headers = ["Name", "Description", "Geolocation", "Comment"];
        const csvContent = [
            headers.join(','),
            ...locations.map(loc => {
                const row = [
                    loc.name,
                    loc.description,
                    loc.geolocation || '',
                    loc.comment || ''
                ];
                return row.map(field => {
                    const stringField = String(field);
                    if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
                        return `"${stringField.replace(/"/g, '""')}"`;
                    }
                    return stringField;
                }).join(',');
            })
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `kopfkino_locations_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-3xl font-bold text-zinc-900 dark:text-white">Locations</h2>
                <div className="flex flex-wrap gap-2">
                    <input
                        type="file"
                        accept=".csv"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleFileChange}
                    />
                    <Button variant="secondary" onClick={handleImportClick} size="sm">
                        <Upload size={16} />
                        Import CSV
                    </Button>
                    <Button variant="secondary" onClick={handleExportClick} size="sm">
                        <Download size={16} />
                        Export CSV
                    </Button>
                    <Button onClick={() => navigate('new')} size="sm">
                        <Plus size={16} />
                        New Location
                    </Button>
                </div>
            </div>

            {locations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-zinc-500 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                    <MapPin size={48} className="mb-4 opacity-50" />
                    <p>No locations yet. Create your first one!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {locations.map((location) => (
                        <Card
                            key={location.id}
                            hoverable
                            className="!p-0 flex flex-col h-full cursor-pointer"
                            onClick={() => navigate(location.id)}
                        >
                            {location.thumbnailUrl ? (
                                <img src={location.thumbnailUrl} alt={location.name} className="w-full h-48 object-cover bg-zinc-100 dark:bg-zinc-800" />
                            ) : (
                                <div className="w-full h-48 bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-300 dark:text-zinc-700">
                                    <MapPin size={32} />
                                </div>
                            )}
                            <div className="p-6 flex flex-col gap-2 flex-1">
                                <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">{location.name}</h3>
                                <p className="text-zinc-500 text-sm line-clamp-3 mb-auto">{location.description}</p>
                                {location.geolocation && (
                                    <div className="flex items-center gap-2 text-xs text-zinc-400 mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                                        <MapPin size={14} />
                                        <span>{location.geolocation}</span>
                                    </div>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};
