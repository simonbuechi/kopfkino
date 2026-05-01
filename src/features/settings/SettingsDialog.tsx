import React, { useState, useEffect } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { X, Save, Link, Unlink } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useStore } from '../../hooks/useStore';
import { usePollinationsAuth } from '../../hooks/usePollinationsAuth';
import { POLLINATIONS_MODELS } from '../../services/pollinationsService';
import type { Settings } from '../../types/types';

const SIZE_PRESET_LABELS = ['Portrait (768×1024)', 'Square (1024×1024)', 'Landscape (1024×768)'];

const selectClass =
    'w-full px-3 py-2 rounded-lg text-sm appearance-none ' +
    'bg-white dark:bg-primary-950 border border-primary-300 dark:border-primary-700 ' +
    'text-primary-900 dark:text-primary-100 ' +
    'focus:outline-none focus:ring-2 focus:ring-primary-600/20 dark:focus:ring-primary-400/20 focus:border-primary-600 dark:focus:border-primary-400 ' +
    'transition-colors';

interface SettingsDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SettingsDialog: React.FC<SettingsDialogProps> = ({ isOpen, onClose }) => {
    const { settings, updateSettings } = useStore();
    const { isConnected, connect, disconnect } = usePollinationsAuth();
    const [local, setLocal] = useState<Settings>(settings);

    useEffect(() => {
        setLocal(settings);
    }, [settings]);

    const set = <K extends keyof Settings>(key: K, value: Settings[K]) =>
        setLocal(prev => ({ ...prev, [key]: value }));

    const handleSave = () => {
        updateSettings(local);
        onClose();
    };

    return (
        <Dialog open={isOpen} onClose={onClose} className="relative z-50">
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
            <div className="fixed inset-0 flex items-center justify-center p-4">
                <DialogPanel className="w-full max-w-md bg-white dark:bg-primary-900 rounded-xl border border-primary-200 dark:border-primary-800 p-6 shadow-xl flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-base font-semibold text-primary-900 dark:text-primary-100">
                            Settings
                        </DialogTitle>
                        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
                            <X size={18} />
                        </Button>
                    </div>

                    {/* Pollinations Account */}
                    <div className="flex flex-col gap-3">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-primary-400 dark:text-primary-500">
                            Pollinations Account
                        </h3>
                        {isConnected ? (
                            <div className="flex items-center justify-between p-3 rounded-lg bg-primary-50 dark:bg-primary-800 border border-primary-200 dark:border-primary-700">
                                <div className="flex items-center gap-2 text-sm text-primary-700 dark:text-primary-300">
                                    <Link size={14} className="text-green-500" />
                                    Connected
                                </div>
                                <Button size="sm" variant="danger" onClick={disconnect}>
                                    <Unlink size={14} /> Disconnect
                                </Button>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2">
                                <p className="text-xs text-primary-500 dark:text-primary-400">
                                    Connect your Pollinations account to generate images. Your own pollen balance is used.
                                </p>
                                <Button size="sm" variant="secondary" onClick={connect}>
                                    <Link size={14} /> Connect Pollinations Account
                                </Button>
                            </div>
                        )}
                    </div>

                    <div className="border-t border-primary-100 dark:border-primary-800" />

                    <div className="flex flex-col gap-1">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-primary-400 dark:text-primary-500">
                            Image Generation Defaults
                        </h3>
                        <p className="text-xs text-primary-500 dark:text-primary-400">
                            These values pre-fill the Generate Image modal. You can override them per request.
                        </p>
                    </div>

                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="s-model" className="text-sm font-semibold text-primary-700 dark:text-primary-300">Model</label>
                            <select
                                id="s-model"
                                value={local.pollinationsModel}
                                onChange={(e) => set('pollinationsModel', e.target.value as Settings['pollinationsModel'])}
                                className={selectClass}
                            >
                                {POLLINATIONS_MODELS.map((m) => (
                                    <option key={m.value} value={m.value}>{m.label}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="s-size" className="text-sm font-semibold text-primary-700 dark:text-primary-300">Default Size</label>
                            <select
                                id="s-size"
                                value={local.pollinationsSizeIndex}
                                onChange={(e) => set('pollinationsSizeIndex', Number(e.target.value))}
                                className={selectClass}
                            >
                                {SIZE_PRESET_LABELS.map((label, i) => (
                                    <option key={i} value={i}>{label}</option>
                                ))}
                            </select>
                        </div>

                        <Input
                            id="s-seed"
                            label="Default Seed (optional)"
                            type="number"
                            value={local.pollinationsSeed ?? ''}
                            onChange={(e) => set('pollinationsSeed', e.target.value !== '' ? parseInt(e.target.value, 10) : undefined)}
                            placeholder="Leave empty for random"
                        />

                        <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={local.pollinationsEnhance}
                                onChange={(e) => set('pollinationsEnhance', e.target.checked)}
                                className="w-4 h-4 rounded accent-primary-500"
                            />
                            <span className="text-sm font-semibold text-primary-700 dark:text-primary-300">Enhance prompt by default</span>
                        </label>
                    </div>

                    <div className="flex justify-end gap-3 pt-2 border-t border-primary-100 dark:border-primary-800">
                        <Button variant="ghost" onClick={onClose}>Cancel</Button>
                        <Button onClick={handleSave}>
                            <Save size={16} /> Save
                        </Button>
                    </div>
                </DialogPanel>
            </div>
        </Dialog>
    );
};
