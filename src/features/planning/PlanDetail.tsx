import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Plus,
    Settings,
    Layers,
    CalendarRange,
    Clock,
    Sparkles,
} from 'lucide-react';
import { useStore } from '../../hooks/useStore';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import { Button } from '../../components/ui/Button';
import { BackLink } from '../../components/ui/BackLink';
import { GanttChart } from './GanttChart';
import { PlanModal } from './modals/PlanModal';
import { SectionModal } from './modals/SectionModal';
import { ItemModal } from './modals/ItemModal';
import type { Plan, PlanSection, PlanItem } from '../../types/types';

export const PlanDetail: React.FC = () => {
    const { planId } = useParams<{ planId: string }>();
    const navigate = useNavigate();
    const { plans, savePlan } = useStore();
    const { confirm, confirmDialog } = useConfirmDialog();

    const plan = plans.find(p => p.id === planId);

    // Modal states
    const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
    const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
    const [editingSection, setEditingSection] = useState<PlanSection | null>(null);
    const [isItemModalOpen, setIsItemModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<PlanItem | null>(null);
    const [itemTargetSectionId, setItemTargetSectionId] = useState<string | undefined>(undefined);

    if (!plan) {
        return (
            <div className="p-8 text-center">
                <p className="text-primary-500 mb-4">Plan not found or may have been deleted.</p>
                <Button onClick={() => navigate('..')}>Back to Plans</Button>
            </div>
        );
    }

    // Save modified plan
    const persistPlan = async (updated: Plan) => {
        await savePlan({
            ...updated,
            updatedAt: Date.now(),
        });
    };

    // --- Section handlers ---
    const handleOpenAddSection = () => {
        setEditingSection(null);
        setIsSectionModalOpen(true);
    };

    const handleOpenEditSection = (section: PlanSection) => {
        setEditingSection(section);
        setIsSectionModalOpen(true);
    };

    const handleSaveSection = async (data: { name: string; tag?: string; tagColor?: string }) => {
        if (editingSection) {
            // Edit existing section
            const updatedSections = plan.sections.map(s =>
                s.id === editingSection.id ? { ...s, ...data } : s
            );
            await persistPlan({ ...plan, sections: updatedSections });
        } else {
            // Add new section
            const newSection: PlanSection = {
                id: crypto.randomUUID(),
                ...data,
                order: plan.sections.length,
            };
            await persistPlan({
                ...plan,
                sections: [...plan.sections, newSection],
            });
        }
    };

    const handleDeleteSection = async (sectionId: string) => {
        const sectionToDelete = plan.sections.find(s => s.id === sectionId);
        const itemsCount = plan.items.filter(i => i.sectionId === sectionId).length;

        const warningMsg = itemsCount > 0
            ? `Delete section "${sectionToDelete?.name}" and its ${itemsCount} items?`
            : `Delete section "${sectionToDelete?.name}"?`;

        if (await confirm(warningMsg, { title: 'Delete Section', confirmLabel: 'Delete' })) {
            const updatedSections = plan.sections.filter(s => s.id !== sectionId);
            const updatedItems = plan.items.filter(i => i.sectionId !== sectionId);
            await persistPlan({
                ...plan,
                sections: updatedSections,
                items: updatedItems,
            });
        }
    };

    // --- Item handlers ---
    const handleOpenAddItem = (sectionId?: string) => {
        setEditingItem(null);
        setItemTargetSectionId(sectionId || plan.sections[0]?.id);
        setIsItemModalOpen(true);
    };

    const handleOpenEditItem = (item: PlanItem) => {
        setEditingItem(item);
        setItemTargetSectionId(item.sectionId);
        setIsItemModalOpen(true);
    };

    const handleSaveItem = async (itemData: Omit<PlanItem, 'id'>) => {
        if (editingItem) {
            const updatedItems = plan.items.map(i =>
                i.id === editingItem.id ? { ...itemData, id: editingItem.id } : i
            );
            await persistPlan({ ...plan, items: updatedItems });
        } else {
            const newItem: PlanItem = {
                id: crypto.randomUUID(),
                ...itemData,
                order: plan.items.length,
            };
            await persistPlan({
                ...plan,
                items: [...plan.items, newItem],
            });
        }
    };

    const handleDeleteItem = async (itemId: string) => {
        const itemToDelete = plan.items.find(i => i.id === itemId);
        if (await confirm(`Delete "${itemToDelete?.name}"?`, { title: 'Delete Item', confirmLabel: 'Delete' })) {
            const updatedItems = plan.items.filter(i => i.id !== itemId);
            await persistPlan({ ...plan, items: updatedItems });
        }
    };

    // --- Plan Settings handler ---
    const handleSavePlanSettings = async (data: {
        name: string;
        description?: string;
        timelineMode: 'auto' | 'manual';
        manualStartDate?: string;
        manualEndDate?: string;
    }) => {
        await persistPlan({
            ...plan,
            ...data,
        });
    };

    // Quick add default template sections
    const handleCreateTemplateSections = async () => {
        const templateSections: PlanSection[] = [
            { id: crypto.randomUUID(), name: 'Pre-Production', tag: 'Prep', tagColor: 'amber', order: 0 },
            { id: crypto.randomUUID(), name: 'Principal Photography', tag: 'Shoot', tagColor: 'emerald', order: 1 },
            { id: crypto.randomUUID(), name: 'Post-Production & VFX', tag: 'Post', tagColor: 'blue', order: 2 },
        ];
        await persistPlan({
            ...plan,
            sections: templateSections,
        });
    };

    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-300">
            {/* Top Navigation & Breadcrumbs */}
            <div className="flex items-center justify-between">
                <BackLink to=".." label="Back to plans" />
                <div className="flex items-center gap-2">
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setIsPlanModalOpen(true)}
                        className="flex items-center gap-1.5"
                    >
                        <Settings size={15} /> Plan Settings
                    </Button>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleOpenAddSection}
                        className="flex items-center gap-1.5"
                    >
                        <Layers size={15} /> Add Section
                    </Button>
                    {plan.sections.length > 0 && (
                        <Button
                            size="sm"
                            onClick={() => handleOpenAddItem()}
                            className="flex items-center gap-1.5"
                        >
                            <Plus size={16} /> Add Item
                        </Button>
                    )}
                </div>
            </div>

            {/* Plan Header Info */}
            <div className="bg-white dark:bg-primary-900 border border-primary-200 dark:border-primary-800 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-black text-primary-900 dark:text-white tracking-tight">
                            {plan.name}
                        </h1>
                        <span className="px-2.5 py-1 text-xs font-bold rounded-lg border bg-primary-100 dark:bg-primary-800 text-primary-700 dark:text-primary-300 border-primary-200 dark:border-primary-700 flex items-center gap-1.5">
                            <Clock size={12} />
                            {plan.timelineMode === 'manual' ? 'Manual Timeline' : 'Auto Timeline'}
                        </span>
                    </div>
                    {plan.description && (
                        <p className="text-sm text-primary-500 dark:text-primary-400">
                            {plan.description}
                        </p>
                    )}
                </div>

                <div className="flex items-center gap-3 text-xs text-primary-500 dark:text-primary-400">
                    <span className="px-3 py-1.5 rounded-xl bg-primary-50 dark:bg-primary-800/40 border border-primary-200 dark:border-primary-800 font-medium">
                        {plan.sections.length} Sections
                    </span>
                    <span className="px-3 py-1.5 rounded-xl bg-primary-50 dark:bg-primary-800/40 border border-primary-200 dark:border-primary-800 font-medium">
                        {plan.items.length} Items
                    </span>
                </div>
            </div>

            {/* Main Content: Gantt Chart or Empty Template View */}
            {plan.sections.length === 0 ? (
                <div className="p-12 text-center bg-white dark:bg-primary-900 border border-dashed border-primary-300 dark:border-primary-800 rounded-2xl flex flex-col items-center max-w-2xl mx-auto my-8">
                    <div className="w-14 h-14 rounded-2xl bg-secondary-100 dark:bg-secondary-950/60 text-secondary-600 flex items-center justify-center mb-4">
                        <CalendarRange size={32} />
                    </div>
                    <h2 className="text-xl font-bold text-primary-900 dark:text-white mb-2">
                        Get Started with Sections
                    </h2>
                    <p className="text-sm text-primary-500 dark:text-primary-400 max-w-md mb-6">
                        Sections divide your production plan into phases or departments (like Pre-Production, Principal Photography, or VFX). Each section can have its own configurable tag.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-3">
                        <Button onClick={handleCreateTemplateSections} className="flex items-center gap-1.5">
                            <Sparkles size={16} /> Use Production Template (3 Phases)
                        </Button>
                        <Button variant="secondary" onClick={handleOpenAddSection} className="flex items-center gap-1.5">
                            <Plus size={16} /> Add Custom Section
                        </Button>
                    </div>
                </div>
            ) : (
                <GanttChart
                    plan={plan}
                    onEditSection={handleOpenEditSection}
                    onDeleteSection={handleDeleteSection}
                    onAddItem={handleOpenAddItem}
                    onEditItem={handleOpenEditItem}
                    onDeleteItem={handleDeleteItem}
                />
            )}

            {/* Modals */}
            <PlanModal
                isOpen={isPlanModalOpen}
                onClose={() => setIsPlanModalOpen(false)}
                onSave={handleSavePlanSettings}
                initialPlan={plan}
            />

            <SectionModal
                isOpen={isSectionModalOpen}
                onClose={() => setIsSectionModalOpen(false)}
                onSave={handleSaveSection}
                initialSection={editingSection}
            />

            <ItemModal
                isOpen={isItemModalOpen}
                onClose={() => setIsItemModalOpen(false)}
                onSave={handleSaveItem}
                sections={plan.sections}
                defaultSectionId={itemTargetSectionId}
                initialItem={editingItem}
            />

            {confirmDialog}
        </div>
    );
};
