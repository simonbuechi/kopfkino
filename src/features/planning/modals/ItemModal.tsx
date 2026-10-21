import React, { useState } from 'react';
import { Calendar, Plus, Trash2, User, Package, MapPin, Clapperboard, Film, Tag } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Input, TextArea } from '../../../components/ui/Input';
import { useStore } from '../../../hooks/useStore';
import type { PlanItem, PlanSection, PlanItemCategory, PlanDateEntry } from '../../../types/types';
import { formatDate, addDays } from '../utils/timelineUtils';

interface ItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Omit<PlanItem, 'id'>) => void;
    sections: PlanSection[];
    defaultSectionId?: string;
    initialItem?: PlanItem | null;
}

const CATEGORIES: { label: string; value: PlanItemCategory; icon: React.ComponentType<{ size: number; className?: string }> }[] = [
    { label: 'Person', value: 'person', icon: User },
    { label: 'Asset', value: 'asset', icon: Package },
    { label: 'Location', value: 'location', icon: MapPin },
    { label: 'Scene', value: 'scene', icon: Clapperboard },
    { label: 'Shot', value: 'shot', icon: Film },
    { label: 'Other', value: 'other', icon: Tag },
];

const ItemForm: React.FC<{
    initialItem?: PlanItem | null;
    sections: PlanSection[];
    defaultSectionId?: string;
    onClose: () => void;
    onSave: ItemModalProps['onSave'];
}> = ({ initialItem, sections, defaultSectionId, onClose, onSave }) => {
    const { people, assets, locations, scenes } = useStore();

    const [sectionId, setSectionId] = useState<string>(() => {
        if (initialItem?.sectionId) return initialItem.sectionId;
        if (defaultSectionId) return defaultSectionId;
        return sections[0]?.id || '';
    });
    const [name, setName] = useState(initialItem?.name || '');
    const [category, setCategory] = useState<PlanItemCategory>(initialItem?.category || 'person');
    const [entityId, setEntityId] = useState<string>(initialItem?.entityId || '');
    const [entityName, setEntityName] = useState<string>(initialItem?.entityName || '');
    const [comment, setComment] = useState(initialItem?.comment || '');
    const [dates, setDates] = useState<PlanDateEntry[]>(() => {
        if (initialItem?.dates && initialItem.dates.length > 0) return initialItem.dates;
        const today = new Date();
        return [
            {
                id: crypto.randomUUID(),
                startDate: formatDate(today),
                endDate: formatDate(addDays(today, 5)),
                label: '',
            },
        ];
    });

    const allShots = scenes.flatMap(s =>
        (s.shots || []).map(shot => ({
            ...shot,
            sceneNumber: s.number,
            sceneName: s.name,
            displayName: `Scene ${s.number}: Shot ${shot.number || ''} — ${shot.name || 'Untitled'}`,
        }))
    );

    const handleEntitySelect = (id: string) => {
        setEntityId(id);
        let selectedLabel = '';

        if (category === 'person') {
            const p = people.find(item => item.id === id);
            selectedLabel = p ? `${p.name}${p.role ? ` (${p.role})` : ''}` : '';
        } else if (category === 'asset') {
            const a = assets.find(item => item.id === id);
            selectedLabel = a ? `${a.name}${a.type ? ` (${a.type})` : ''}` : '';
        } else if (category === 'location') {
            const l = locations.find(item => item.id === id);
            selectedLabel = l ? `${l.name}${l.type ? ` (${l.type})` : ''}` : '';
        } else if (category === 'scene') {
            const s = scenes.find(item => item.id === id);
            selectedLabel = s ? `Scene ${s.number}: ${s.name || 'Untitled'}` : '';
        } else if (category === 'shot') {
            const sh = allShots.find(item => item.id === id);
            selectedLabel = sh ? sh.displayName : '';
        }

        setEntityName(selectedLabel);

        if (!name.trim() || name === entityName) {
            setName(selectedLabel);
        }
    };

    const handleCategoryChange = (newCat: PlanItemCategory) => {
        setCategory(newCat);
        setEntityId('');
        setEntityName('');
    };

    const handleAddDateRange = () => {
        const lastDate = dates[dates.length - 1];
        let nextStart = new Date();
        if (lastDate && lastDate.endDate) {
            const endD = new Date(lastDate.endDate);
            nextStart = addDays(endD, 2);
        }
        setDates(prev => [
            ...prev,
            {
                id: crypto.randomUUID(),
                startDate: formatDate(nextStart),
                endDate: formatDate(addDays(nextStart, 5)),
                label: '',
            },
        ]);
    };

    const handleUpdateDate = (index: number, field: keyof PlanDateEntry, value: string) => {
        setDates(prev => {
            const updated = [...prev];
            const current = { ...updated[index], [field]: value };
            if (field === 'startDate' && current.endDate && value > current.endDate) {
                current.endDate = value;
            }
            updated[index] = current;
            return updated;
        });
    };

    const handleRemoveDate = (index: number) => {
        if (dates.length <= 1) return;
        setDates(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !sectionId) return;

        const validDates = dates.filter(d => d.startDate && d.endDate && d.startDate <= d.endDate);
        if (validDates.length === 0) return;

        onSave({
            sectionId,
            name: name.trim(),
            category,
            entityId: entityId || undefined,
            entityName: entityName || undefined,
            dates: validDates,
            comment: comment.trim() || undefined,
        });
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="mt-4 space-y-5">
            {/* Section Selector */}
            <div>
                <label className="block text-sm font-semibold text-primary-900 dark:text-primary-100 mb-1">
                    Section
                </label>
                <select
                    value={sectionId}
                    onChange={(e) => setSectionId(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-white dark:bg-primary-900 border border-primary-200 dark:border-primary-800 rounded-lg text-primary-900 dark:text-white text-sm focus:ring-2 focus:ring-secondary-500"
                >
                    {sections.map(s => (
                        <option key={s.id} value={s.id}>
                            {s.name} {s.tag ? `[${s.tag}]` : ''}
                        </option>
                    ))}
                </select>
            </div>

            {/* Category Selector */}
            <div>
                <label className="block text-sm font-semibold text-primary-900 dark:text-primary-100 mb-2">
                    Category
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {CATEGORIES.map(cat => {
                        const Icon = cat.icon;
                        const isSelected = category === cat.value;
                        return (
                            <button
                                key={cat.value}
                                type="button"
                                onClick={() => handleCategoryChange(cat.value)}
                                className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs font-semibold gap-1.5 transition-all ${
                                    isSelected
                                        ? 'border-secondary-500 bg-secondary-50 dark:bg-secondary-950/40 text-secondary-700 dark:text-secondary-300 ring-1 ring-secondary-500 shadow-xs'
                                        : 'border-primary-200 dark:border-primary-800 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-800'
                                }`}
                            >
                                <Icon size={16} />
                                <span>{cat.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Dynamic Entity Dropdown */}
            {category !== 'other' && (
                <div className="p-3 bg-primary-50 dark:bg-primary-950/40 rounded-xl border border-primary-200 dark:border-primary-800 space-y-2">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-primary-500 dark:text-primary-400">
                        Select {category.toUpperCase()} from project
                    </label>

                    {category === 'person' && (
                        <select
                            value={entityId}
                            onChange={(e) => handleEntitySelect(e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-primary-900 border border-primary-200 dark:border-primary-800 rounded-lg text-primary-900 dark:text-white text-sm"
                        >
                            <option value="">-- Choose a Person ({people.length} available) --</option>
                            {people.map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.name} {p.role ? `(${p.role})` : ''}
                                </option>
                            ))}
                        </select>
                    )}

                    {category === 'asset' && (
                        <select
                            value={entityId}
                            onChange={(e) => handleEntitySelect(e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-primary-900 border border-primary-200 dark:border-primary-800 rounded-lg text-primary-900 dark:text-white text-sm"
                        >
                            <option value="">-- Choose an Asset ({assets.length} available) --</option>
                            {assets.map(a => (
                                <option key={a.id} value={a.id}>
                                    {a.name} {a.type ? `(${a.type})` : ''}
                                </option>
                            ))}
                        </select>
                    )}

                    {category === 'location' && (
                        <select
                            value={entityId}
                            onChange={(e) => handleEntitySelect(e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-primary-900 border border-primary-200 dark:border-primary-800 rounded-lg text-primary-900 dark:text-white text-sm"
                        >
                            <option value="">-- Choose a Location ({locations.length} available) --</option>
                            {locations.map(l => (
                                <option key={l.id} value={l.id}>
                                    {l.name} {l.type ? `(${l.type})` : ''}
                                </option>
                            ))}
                        </select>
                    )}

                    {category === 'scene' && (
                        <select
                            value={entityId}
                            onChange={(e) => handleEntitySelect(e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-primary-900 border border-primary-200 dark:border-primary-800 rounded-lg text-primary-900 dark:text-white text-sm"
                        >
                            <option value="">-- Choose a Scene ({scenes.length} available) --</option>
                            {scenes.map(s => (
                                <option key={s.id} value={s.id}>
                                    Scene {s.number}: {s.name || 'Untitled'}
                                </option>
                            ))}
                        </select>
                    )}

                    {category === 'shot' && (
                        <select
                            value={entityId}
                            onChange={(e) => handleEntitySelect(e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-primary-900 border border-primary-200 dark:border-primary-800 rounded-lg text-primary-900 dark:text-white text-sm"
                        >
                            <option value="">-- Choose a Shot ({allShots.length} available) --</option>
                            {allShots.map(sh => (
                                <option key={sh.id} value={sh.id}>
                                    {sh.displayName}
                                </option>
                            ))}
                        </select>
                    )}
                </div>
            )}

            {/* Name Input */}
            <Input
                label="Item Name"
                required
                placeholder="e.g. Lead Actor Shooting, Car Rig Prep, Scene 3 Shoot"
                value={name}
                onChange={(e) => setName(e.target.value)}
            />

            {/* Multiple Date Entries */}
            <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-primary-900 dark:text-primary-100 flex items-center gap-1.5">
                        <Calendar size={16} /> Date Ranges
                    </label>
                    <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={handleAddDateRange}
                        className="text-xs"
                    >
                        <Plus size={14} /> Add Date Range
                    </Button>
                </div>

                <div className="space-y-3">
                    {dates.map((d, index) => (
                        <div
                            key={d.id || index}
                            className="p-3 bg-primary-50/70 dark:bg-primary-950/30 rounded-xl border border-primary-200 dark:border-primary-800 space-y-2"
                        >
                            <div className="flex items-center justify-between text-xs text-primary-500 font-medium">
                                <span>Date Range #{index + 1}</span>
                                {dates.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveDate(index)}
                                        className="text-danger-500 hover:text-danger-700 flex items-center gap-1 p-0.5"
                                        title="Remove date range"
                                    >
                                        <Trash2 size={13} /> Remove
                                    </button>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <Input
                                    type="date"
                                    label="Start Date"
                                    required
                                    value={d.startDate}
                                    onChange={(e) => handleUpdateDate(index, 'startDate', e.target.value)}
                                />
                                <Input
                                    type="date"
                                    label="End Date"
                                    required
                                    value={d.endDate}
                                    onChange={(e) => handleUpdateDate(index, 'endDate', e.target.value)}
                                />
                            </div>

                            <Input
                                label="Optional Range Label"
                                placeholder="e.g. Rehearsal, Principal Shoot, Pickup"
                                value={d.label || ''}
                                onChange={(e) => handleUpdateDate(index, 'label', e.target.value)}
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Comment */}
            <TextArea
                label="Comment / Notes (Optional)"
                placeholder="Add any specific requirements, dependencies or details..."
                rows={3}
                value={comment}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setComment(e.target.value)}
            />

            {/* Modal Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-primary-100 dark:border-primary-800 sticky bottom-0 bg-white dark:bg-primary-900 z-10">
                <Button type="button" variant="ghost" onClick={onClose}>
                    Cancel
                </Button>
                <Button type="submit" disabled={!name.trim() || !sectionId || dates.length === 0}>
                    {initialItem ? 'Save Item' : 'Add Item'}
                </Button>
            </div>
        </form>
    );
};

export const ItemModal: React.FC<ItemModalProps> = ({
    isOpen,
    onClose,
    onSave,
    sections,
    defaultSectionId,
    initialItem,
}) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            size="xl"
            title={initialItem ? 'Edit Plan Item' : 'Add Plan Item'}
            icon={<Calendar size={20} className="text-secondary-600 dark:text-secondary-400" />}
        >
            <ItemForm
                key={initialItem?.id || defaultSectionId || 'new'}
                initialItem={initialItem}
                sections={sections}
                defaultSectionId={defaultSectionId}
                onClose={onClose}
                onSave={onSave}
            />
        </Modal>
    );
};
