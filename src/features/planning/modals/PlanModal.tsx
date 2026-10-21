import React, { useState } from 'react';
import { Calendar } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Input, TextArea } from '../../../components/ui/Input';
import type { Plan } from '../../../types/types';
import { formatDate, addMonths } from '../utils/timelineUtils';

interface PlanModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: {
        name: string;
        description?: string;
        timelineMode: 'auto' | 'manual';
        manualStartDate?: string;
        manualEndDate?: string;
    }) => void;
    initialPlan?: Plan | null;
}

const PlanForm: React.FC<{
    initialPlan?: Plan | null;
    onClose: () => void;
    onSave: PlanModalProps['onSave'];
}> = ({ initialPlan, onClose, onSave }) => {
    const [name, setName] = useState(initialPlan?.name || '');
    const [description, setDescription] = useState(initialPlan?.description || '');
    const [timelineMode, setTimelineMode] = useState<'auto' | 'manual'>(initialPlan?.timelineMode || 'auto');
    const [manualStartDate, setManualStartDate] = useState(
        initialPlan?.manualStartDate || formatDate(new Date())
    );
    const [manualEndDate, setManualEndDate] = useState(
        initialPlan?.manualEndDate || formatDate(addMonths(new Date(), 6))
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        onSave({
            name: name.trim(),
            description: description.trim() || undefined,
            timelineMode,
            manualStartDate: timelineMode === 'manual' ? manualStartDate : undefined,
            manualEndDate: timelineMode === 'manual' ? manualEndDate : undefined,
        });
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <Input
                label="Plan Name"
                required
                placeholder="e.g. Principal Photography, Post-Production, Master Schedule"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
            />

            <TextArea
                label="Description (Optional)"
                placeholder="Briefly describe the purpose of this plan..."
                rows={3}
                value={description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
            />

            <div className="space-y-2">
                <label className="text-sm font-semibold text-primary-900 dark:text-primary-100">
                    Timeline Span
                </label>
                <div className="grid grid-cols-2 gap-3">
                    <label
                        className={`flex flex-col p-3 rounded-xl border cursor-pointer transition-all ${
                            timelineMode === 'auto'
                                ? 'border-secondary-500 bg-secondary-50/50 dark:bg-secondary-950/20 ring-1 ring-secondary-500'
                                : 'border-primary-200 dark:border-primary-800 hover:border-primary-300'
                        }`}
                    >
                        <div className="flex items-center gap-2">
                            <input
                                type="radio"
                                name="timelineMode"
                                value="auto"
                                checked={timelineMode === 'auto'}
                                onChange={() => setTimelineMode('auto')}
                                className="text-secondary-600"
                            />
                            <span className="font-semibold text-sm text-primary-900 dark:text-white">
                                Automatic
                            </span>
                        </div>
                        <span className="text-xs text-primary-500 dark:text-primary-400 mt-1 pl-5">
                            Derives from items (or defaults to 6 months from now)
                        </span>
                    </label>

                    <label
                        className={`flex flex-col p-3 rounded-xl border cursor-pointer transition-all ${
                            timelineMode === 'manual'
                                ? 'border-secondary-500 bg-secondary-50/50 dark:bg-secondary-950/20 ring-1 ring-secondary-500'
                                : 'border-primary-200 dark:border-primary-800 hover:border-primary-300'
                        }`}
                    >
                        <div className="flex items-center gap-2">
                            <input
                                type="radio"
                                name="timelineMode"
                                value="manual"
                                checked={timelineMode === 'manual'}
                                onChange={() => setTimelineMode('manual')}
                                className="text-secondary-600"
                            />
                            <span className="font-semibold text-sm text-primary-900 dark:text-white">
                                Manual
                            </span>
                        </div>
                        <span className="text-xs text-primary-500 dark:text-primary-400 mt-1 pl-5">
                            Fixed start and end date
                        </span>
                    </label>
                </div>
            </div>

            {timelineMode === 'manual' && (
                <div className="grid grid-cols-2 gap-4 p-3 bg-primary-50 dark:bg-primary-950/40 rounded-xl border border-primary-200 dark:border-primary-800">
                    <Input
                        type="date"
                        label="Start Date"
                        required
                        value={manualStartDate}
                        onChange={(e) => setManualStartDate(e.target.value)}
                    />
                    <Input
                        type="date"
                        label="End Date"
                        required
                        value={manualEndDate}
                        onChange={(e) => setManualEndDate(e.target.value)}
                    />
                </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-primary-100 dark:border-primary-800">
                <Button type="button" variant="ghost" onClick={onClose}>
                    Cancel
                </Button>
                <Button type="submit" disabled={!name.trim()}>
                    {initialPlan ? 'Save Changes' : 'Create Plan'}
                </Button>
            </div>
        </form>
    );
};

export const PlanModal: React.FC<PlanModalProps> = ({
    isOpen,
    onClose,
    onSave,
    initialPlan,
}) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            size="lg"
            title={initialPlan ? 'Edit Plan' : 'Create New Plan'}
            icon={<Calendar size={20} className="text-secondary-600 dark:text-secondary-400" />}
        >
            <PlanForm
                key={initialPlan?.id || 'new'}
                initialPlan={initialPlan}
                onClose={onClose}
                onSave={onSave}
            />
        </Modal>
    );
};
