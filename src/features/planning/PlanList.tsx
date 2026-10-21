import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, CalendarRange, Layers, Calendar, ChevronRight } from 'lucide-react';
import { useStore } from '../../hooks/useStore';
import { useProjects } from '../../hooks/useProjects';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import { Button } from '../../components/ui/Button';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { PlanModal } from './modals/PlanModal';
import { getTimelineBounds } from './utils/timelineUtils';
import type { Plan } from '../../types/types';

export const PlanList: React.FC = () => {
    const navigate = useNavigate();
    const { plans, savePlan, deletePlan } = useStore();
    const { activeProjectId } = useProjects();
    const { confirm, confirmDialog } = useConfirmDialog();

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const handleCreatePlan = async (data: {
        name: string;
        description?: string;
        timelineMode: 'auto' | 'manual';
        manualStartDate?: string;
        manualEndDate?: string;
    }) => {
        if (!activeProjectId) return;

        const newPlan: Plan = {
            id: crypto.randomUUID(),
            projectId: activeProjectId,
            name: data.name,
            description: data.description,
            timelineMode: data.timelineMode,
            manualStartDate: data.manualStartDate,
            manualEndDate: data.manualEndDate,
            sections: [
                {
                    id: crypto.randomUUID(),
                    name: 'Phase 1: Production',
                    tag: 'Phase 1',
                    tagColor: 'blue',
                    order: 0,
                },
            ],
            items: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };

        await savePlan(newPlan);
        navigate(newPlan.id);
    };

    const handleDeletePlan = async (e: React.MouseEvent, plan: Plan) => {
        e.stopPropagation();
        if (
            await confirm(`Are you sure you want to delete plan "${plan.name}"? This cannot be undone.`, {
                title: 'Delete Plan',
                confirmLabel: 'Delete',
            })
        ) {
            await deletePlan(plan.id);
        }
    };

    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-300">
            <PageHeader
                title="Planning"
                actions={
                    <Button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-1.5">
                        <Plus size={18} /> New Plan
                    </Button>
                }
            />

            {plans.length === 0 ? (
                <EmptyState
                    icon={<CalendarRange size={48} />}
                    message="No plans yet"
                    description="Create your first production plan to organize actors, equipment, scenes, and milestones on a Gantt chart."
                    action={
                        <Button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-1.5">
                            <Plus size={18} /> Create Your First Plan
                        </Button>
                    }
                />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {plans.map(plan => {
                        const bounds = getTimelineBounds(plan);
                        return (
                            <Card
                                key={plan.id}
                                hoverable
                                className="cursor-pointer group flex flex-col justify-between"
                                onClick={() => navigate(plan.id)}
                            >
                                <div className="space-y-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <h3 className="font-bold text-lg text-primary-900 dark:text-white group-hover:text-secondary-600 dark:group-hover:text-secondary-400 transition-colors line-clamp-1">
                                            {plan.name}
                                        </h3>
                                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-primary-100 dark:bg-primary-800 text-primary-700 dark:text-primary-300 shrink-0">
                                            {plan.timelineMode === 'manual' ? 'Manual' : 'Auto'}
                                        </span>
                                    </div>

                                    {plan.description && (
                                        <p className="text-xs text-primary-500 dark:text-primary-400 line-clamp-2">
                                            {plan.description}
                                        </p>
                                    )}

                                    {/* Timeline Span Badge */}
                                    <div className="flex items-center gap-2 text-xs text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-black/30 px-3 py-2 rounded-xl border border-primary-100 dark:border-primary-800">
                                        <Calendar size={14} className="shrink-0 text-secondary-500" />
                                        <span className="font-medium">
                                            {bounds.startStr} — {bounds.endStr}
                                        </span>
                                        <span className="ml-auto text-primary-400 font-normal">
                                            ({bounds.totalDays}d)
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-4 mt-4 border-t border-primary-100 dark:border-primary-800 text-xs text-primary-400">
                                    <div className="flex items-center gap-3">
                                        <span className="flex items-center gap-1">
                                            <Layers size={13} /> {plan.sections.length} sections
                                        </span>
                                        <span>•</span>
                                        <span>{plan.items.length} items</span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => handleDeletePlan(e, plan)}
                                            className="text-danger-500 hover:text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-950/40 text-xs px-2 h-7"
                                        >
                                            Delete
                                        </Button>
                                        <ChevronRight size={16} className="text-primary-400 group-hover:translate-x-0.5 transition-transform" />
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}

            <PlanModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSave={handleCreatePlan}
            />

            {confirmDialog}
        </div>
    );
};
