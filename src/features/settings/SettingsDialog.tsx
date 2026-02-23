import React, { useState, useEffect } from 'react';
import { X, Save, Key } from 'lucide-react';
import { useStore } from '../../hooks/useStore';
import { Button } from '../../components/ui/Button';
import { Dialog } from '@headlessui/react';
import type { Settings, AspectRatio } from '../../types/types';

interface SettingsDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SettingsDialog: React.FC<SettingsDialogProps> = ({ isOpen, onClose }) => {
    const { settings, updateSettings } = useStore();
    const [localSettings, setLocalSettings] = useState<Settings>(settings);

    // Sync local state when store settings change (e.g. initial load)
    useEffect(() => {
        setLocalSettings(settings);
    }, [settings]);

    const handleSave = () => {
        updateSettings(localSettings);
        onClose();
    };

    const handleAspectRatioChange = (ratio: AspectRatio) => {
        setLocalSettings(prev => ({ ...prev, aspectRatio: ratio }));
    };

    const toggleRandomSeed = () => {
        setLocalSettings(prev => ({ ...prev, useRandomSeed: !prev.useRandomSeed }));
    };

    const handleSeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value);
        if (!isNaN(val)) {
            setLocalSettings(prev => ({ ...prev, customSeed: val }));
        }
    };

    return (
        <Dialog open={isOpen} onClose={onClose} className="relative z-50">
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />

            <div className="fixed inset-0 flex items-center justify-center p-4">
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-primary-900 border border-primary-200 dark:border-primary-800 p-6 shadow-xl transition-all">
                    <div className="flex justify-between items-center mb-6">
                        <Dialog.Title className="text-xl font-semibold text-primary-900 dark:text-white">
                            Image Generation Settings
                        </Dialog.Title>
                        <button onClick={onClose} className="text-primary-500 hover:text-primary-700 dark:hover:text-primary-300">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="space-y-6">
                        {/* API Key */}
                        <div>
                            <label className="block text-sm font-medium text-primary-700 dark:text-primary-300 mb-2">
                                <span className="flex items-center gap-1.5"><Key size={14} /> API Key</span>
                            </label>
                            <input
                                type="password"
                                value={localSettings.aiApiKey || ''}
                                onChange={(e) => setLocalSettings(prev => ({ ...prev, aiApiKey: e.target.value }))}
                                className="block w-full rounded-md border-0 py-1.5 text-primary-900 shadow-sm ring-1 ring-inset ring-primary-300 placeholder:text-primary-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 dark:bg-primary-800 dark:text-white dark:ring-primary-700 sm:text-sm sm:leading-6 px-3"
                                placeholder="Enter your AI API key"
                            />
                            <p className="mt-1 text-xs text-primary-500">Required for AI image generation.</p>
                        </div>

                        {/* Aspect Ratio */}
                        <div>
                            <label className="block text-sm font-medium text-primary-700 dark:text-primary-300 mb-2">AspectRatio</label>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => handleAspectRatioChange('16:9')}
                                    className={`flex-1 py-2 px-3 rounded-md text-sm font-medium border transition-colors ${localSettings.aspectRatio === '16:9'
                                        ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-800 dark:text-indigo-400'
                                        : 'bg-white dark:bg-primary-900 border-primary-200 dark:border-primary-700 text-primary-700 dark:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-800'
                                        }`}
                                >
                                    16:9 (Landscape)
                                </button>
                                <button
                                    onClick={() => handleAspectRatioChange('1:1')}
                                    className={`flex-1 py-2 px-3 rounded-md text-sm font-medium border transition-colors ${localSettings.aspectRatio === '1:1'
                                        ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-800 dark:text-indigo-400'
                                        : 'bg-white dark:bg-primary-900 border-primary-200 dark:border-primary-700 text-primary-700 dark:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-800'
                                        }`}
                                >
                                    1:1 (Square)
                                </button>
                            </div>
                        </div>

                        {/* Seed */}
                        <div>
                            <label className="block text-sm font-medium text-primary-700 dark:text-primary-300 mb-2">Seed</label>
                            <div className="flex items-center gap-2 mb-3">
                                <input
                                    type="checkbox"
                                    id="randomSeed"
                                    checked={localSettings.useRandomSeed}
                                    onChange={toggleRandomSeed}
                                    className="rounded border-primary-300 text-indigo-600 focus:ring-indigo-500 dark:border-primary-700 dark:bg-primary-800"
                                />
                                <label htmlFor="randomSeed" className="text-sm text-primary-600 dark:text-primary-400">Use Random Seed</label>
                            </div>

                            {!localSettings.useRandomSeed && (
                                <div>
                                    <input
                                        type="number"
                                        value={localSettings.customSeed || 0}
                                        onChange={handleSeedChange}
                                        className="block w-full rounded-md border-0 py-1.5 text-primary-900 shadow-sm ring-1 ring-inset ring-primary-300 placeholder:text-primary-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 dark:bg-primary-800 dark:text-white dark:ring-primary-700 sm:text-sm sm:leading-6 px-3"
                                        placeholder="Enter seed number"
                                    />
                                    <p className="mt-1 text-xs text-primary-500">Same seed produces identical images for same prompt.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-8 flex justify-end gap-3">
                        <Button variant="secondary" onClick={onClose}>Cancel</Button>
                        <Button onClick={handleSave}>
                            <Save size={16} /> Save Settings
                        </Button>
                    </div>
                </Dialog.Panel>
            </div>
        </Dialog>
    );
};
