import React, { useState } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { Button } from '../../components/ui/Button';
import { Input, TextArea } from '../../components/ui/Input';
import { Loader2, Sparkles } from 'lucide-react';
import { POLLINATIONS_MODELS, type GenerateImageParams, type PollinationsModel } from '../../services/pollinationsService';

const SIZE_PRESETS = [
    { label: 'Portrait (768×1024)', width: 768, height: 1024 },
    { label: 'Square (1024×1024)', width: 1024, height: 1024 },
    { label: 'Landscape (1024×768)', width: 1024, height: 768 },
] as const;

const selectClass =
    'w-full px-3 py-2 rounded-lg text-sm appearance-none ' +
    'bg-white dark:bg-primary-950 border border-primary-300 dark:border-primary-700 ' +
    'text-primary-900 dark:text-primary-100 ' +
    'focus:outline-none focus:ring-2 focus:ring-primary-600/20 dark:focus:ring-primary-400/20 focus:border-primary-600 dark:focus:border-primary-400 ' +
    'transition-colors disabled:opacity-50';

interface Props {
    initialPrompt?: string;
    defaults?: { model: PollinationsModel; sizeIndex: number; enhance: boolean; seed?: number };
    isGenerating: boolean;
    onClose: () => void;
    onConfirm: (params: GenerateImageParams) => void;
}

export const GenerateImageModal: React.FC<Props> = ({ initialPrompt = '', defaults, isGenerating, onClose, onConfirm }) => {
    const [prompt, setPrompt] = useState(initialPrompt);
    const [model, setModel] = useState<PollinationsModel>(defaults?.model ?? 'flux');
    const [sizeIndex, setSizeIndex] = useState(defaults?.sizeIndex ?? 0);
    const [seed, setSeed] = useState(defaults?.seed !== undefined ? String(defaults.seed) : '');
    const [enhance, setEnhance] = useState(defaults?.enhance ?? false);

    const handleConfirm = () => {
        if (!prompt.trim() || isGenerating) return;
        const { width, height } = SIZE_PRESETS[sizeIndex];
        onConfirm({
            prompt: prompt.trim(),
            model,
            width,
            height,
            seed: seed !== '' ? parseInt(seed, 10) : undefined,
            enhance,
        });
    };

    return (
        <Dialog open onClose={onClose} className="relative z-50">
            <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
            <div className="fixed inset-0 flex items-center justify-center p-4">
                <DialogPanel className="w-full max-w-lg bg-white dark:bg-primary-900 rounded-xl shadow-xl border border-primary-200 dark:border-primary-800 p-6 flex flex-col gap-5">
                    <DialogTitle className="text-base font-semibold text-primary-900 dark:text-primary-100">
                        Generate Image with AI
                    </DialogTitle>

                    <TextArea
                        id="gen-prompt"
                        label="Prompt"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Describe the character image..."
                        disabled={isGenerating}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="gen-model" className="text-sm font-semibold text-primary-700 dark:text-primary-300">Model</label>
                            <select id="gen-model" value={model} onChange={(e) => setModel(e.target.value as PollinationsModel)} className={selectClass} disabled={isGenerating}>
                                {POLLINATIONS_MODELS.map((m) => (
                                    <option key={m.value} value={m.value}>{m.label}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="gen-size" className="text-sm font-semibold text-primary-700 dark:text-primary-300">Size</label>
                            <select id="gen-size" value={sizeIndex} onChange={(e) => setSizeIndex(Number(e.target.value))} className={selectClass} disabled={isGenerating}>
                                {SIZE_PRESETS.map((s, i) => (
                                    <option key={i} value={i}>{s.label}</option>
                                ))}
                            </select>
                        </div>

                        <Input
                            id="gen-seed"
                            label="Seed (optional)"
                            type="number"
                            value={seed}
                            onChange={(e) => setSeed(e.target.value)}
                            placeholder="Random"
                            disabled={isGenerating}
                        />

                        <div className="flex items-end pb-0.5">
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={enhance}
                                    onChange={(e) => setEnhance(e.target.checked)}
                                    className="w-4 h-4 rounded accent-primary-500"
                                    disabled={isGenerating}
                                />
                                <span className="text-sm font-semibold text-primary-700 dark:text-primary-300">Enhance prompt</span>
                            </label>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-1">
                        <Button variant="ghost" onClick={onClose} disabled={isGenerating}>Cancel</Button>
                        <Button onClick={handleConfirm} disabled={!prompt.trim() || isGenerating}>
                            {isGenerating
                                ? <><Loader2 className="animate-spin" size={14} /> Generating…</>
                                : <><Sparkles size={14} /> Generate</>
                            }
                        </Button>
                    </div>
                </DialogPanel>
            </div>
        </Dialog>
    );
};
