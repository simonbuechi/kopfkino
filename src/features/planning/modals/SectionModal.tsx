import React, { useState } from 'react';
import { Layers, Tag as TagIcon } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import type { PlanSection } from '../../../types/types';

interface SectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: { name: string; tag?: string; tagColor?: string }) => void;
    initialSection?: PlanSection | null;
}

const TAG_COLOR_OPTIONS = [
    { label: 'Blue', value: 'blue', bg: 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300' },
    { label: 'Emerald', value: 'emerald', bg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300' },
    { label: 'Amber', value: 'amber', bg: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300' },
    { label: 'Purple', value: 'purple', bg: 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-300' },
    { label: 'Rose', value: 'rose', bg: 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300' },
    { label: 'Slate', value: 'slate', bg: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300' },
];

const SectionForm: React.FC<{
    initialSection?: PlanSection | null;
    onClose: () => void;
    onSave: SectionModalProps['onSave'];
}> = ({ initialSection, onClose, onSave }) => {
    const [name, setName] = useState(initialSection?.name || '');
    const [tag, setTag] = useState(initialSection?.tag || '');
    const [tagColor, setTagColor] = useState(initialSection?.tagColor || 'blue');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        onSave({
            name: name.trim(),
            tag: tag.trim() || undefined,
            tagColor: tag.trim() ? tagColor : undefined,
        });
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <Input
                label="Section Name"
                required
                placeholder="e.g. Pre-Production, Shooting Block 1, Post & VFX"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
            />

            <div>
                <Input
                    label="Configurable Tag (Optional)"
                    placeholder="e.g. Phase 1, Prep, Shoot, Post"
                    value={tag}
                    onChange={(e) => setTag(e.target.value)}
                />
                <p className="text-xs text-primary-400 mt-1">
                    Free configurable label displayed alongside this section in the Gantt chart.
                </p>
            </div>

            {tag.trim() && (
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-primary-900 dark:text-primary-100 flex items-center gap-1.5">
                        <TagIcon size={14} /> Tag Color
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {TAG_COLOR_OPTIONS.map((c) => (
                            <button
                                type="button"
                                key={c.value}
                                onClick={() => setTagColor(c.value)}
                                className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-all ${c.bg} ${
                                    tagColor === c.value ? 'ring-2 ring-primary-900 dark:ring-white scale-105' : 'opacity-70 hover:opacity-100'
                                }`}
                            >
                                {c.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-primary-100 dark:border-primary-800">
                <Button type="button" variant="ghost" onClick={onClose}>
                    Cancel
                </Button>
                <Button type="submit" disabled={!name.trim()}>
                    {initialSection ? 'Save Section' : 'Add Section'}
                </Button>
            </div>
        </form>
    );
};

export const SectionModal: React.FC<SectionModalProps> = ({
    isOpen,
    onClose,
    onSave,
    initialSection,
}) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            size="md"
            title={initialSection ? 'Edit Section' : 'Add New Section'}
            icon={<Layers size={20} className="text-secondary-600 dark:text-secondary-400" />}
        >
            <SectionForm
                key={initialSection?.id || 'new'}
                initialSection={initialSection}
                onClose={onClose}
                onSave={onSave}
            />
        </Modal>
    );
};
