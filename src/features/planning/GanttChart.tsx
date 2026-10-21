import React, { useState, useMemo } from 'react';
import {
    ChevronDown,
    ChevronRight,
    Plus,
    Edit2,
    Trash2,
    User,
    Package,
    MapPin,
    Clapperboard,
    Film,
    Tag,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import type { Plan, PlanSection, PlanItem, PlanItemCategory } from '../../types/types';
import {
    getTimelineBounds,
    generateTimelineTicks,
    calculateBarPosition,
    getTodayOffsetPercent,
    daysBetween,
    parseDate,
    type ZoomLevel,
} from './utils/timelineUtils';

interface GanttChartProps {
    plan: Plan;
    onEditSection: (section: PlanSection) => void;
    onDeleteSection: (sectionId: string) => void;
    onAddItem: (sectionId: string) => void;
    onEditItem: (item: PlanItem) => void;
    onDeleteItem: (itemId: string) => void;
}

const CATEGORY_COLORS: Record<PlanItemCategory, { bg: string; border: string; text: string; icon: React.ComponentType<{ size: number; className?: string }> }> = {
    person: { bg: 'bg-blue-600 dark:bg-blue-500', border: 'border-blue-700', text: 'text-white', icon: User },
    asset: { bg: 'bg-purple-600 dark:bg-purple-500', border: 'border-purple-700', text: 'text-white', icon: Package },
    location: { bg: 'bg-rose-600 dark:bg-rose-500', border: 'border-rose-700', text: 'text-white', icon: MapPin },
    scene: { bg: 'bg-emerald-600 dark:bg-emerald-500', border: 'border-emerald-700', text: 'text-white', icon: Clapperboard },
    shot: { bg: 'bg-amber-600 dark:bg-amber-500', border: 'border-amber-700', text: 'text-white', icon: Film },
    other: { bg: 'bg-slate-600 dark:bg-slate-500', border: 'border-slate-700', text: 'text-white', icon: Tag },
};

const SECTION_TAG_COLORS: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 border-blue-300 dark:border-blue-800',
    emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
    amber: 'bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300 border-amber-300 dark:border-amber-800',
    purple: 'bg-purple-100 text-purple-700 dark:bg-purple-950/70 dark:text-purple-300 border-purple-300 dark:border-purple-800',
    rose: 'bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border-rose-300 dark:border-rose-800',
    slate: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700',
};

export const GanttChart: React.FC<GanttChartProps> = ({
    plan,
    onEditSection,
    onDeleteSection,
    onAddItem,
    onEditItem,
    onDeleteItem,
}) => {
    const [zoom, setZoom] = useState<ZoomLevel>('month');
    const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

    const toggleSection = (id: string) => {
        setCollapsedSections(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const expandAll = () => setCollapsedSections(new Set());
    const collapseAll = () => {
        const allIds = new Set((plan.sections || []).map(s => s.id));
        setCollapsedSections(allIds);
    };

    // Calculate timeline bounds
    const bounds = useMemo(() => getTimelineBounds(plan), [plan]);
    const ticks = useMemo(() => generateTimelineTicks(bounds, zoom), [bounds, zoom]);
    const todayOffset = useMemo(
        () => getTodayOffsetPercent(bounds.startDate, bounds.totalDays),
        [bounds.startDate, bounds.totalDays]
    );

    // Group items by section
    const itemsBySection = useMemo(() => {
        const map = new Map<string, PlanItem[]>();
        (plan.sections || []).forEach(s => map.set(s.id, []));
        (plan.items || []).forEach(item => {
            const list = map.get(item.sectionId);
            if (list) list.push(item);
            else {
                // Orphaned items placed under first section or virtual section
                const first = plan.sections[0]?.id;
                if (first && map.has(first)) map.get(first)!.push(item);
            }
        });
        return map;
    }, [plan.sections, plan.items]);

    return (
        <div className="bg-white dark:bg-primary-900 border border-primary-200 dark:border-primary-800 rounded-2xl shadow-sm flex flex-col overflow-hidden">
            {/* Gantt Control Toolbar */}
            <div className="p-4 border-b border-primary-200 dark:border-primary-800 flex flex-wrap items-center justify-between gap-3 bg-primary-50/50 dark:bg-black/20">
                <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-primary-500 dark:text-primary-400">
                        Zoom:
                    </span>
                    <div className="inline-flex rounded-lg p-0.5 bg-primary-100 dark:bg-primary-800">
                        {(['month', 'week', 'day'] as ZoomLevel[]).map(level => (
                            <button
                                key={level}
                                onClick={() => setZoom(level)}
                                className={`px-3 py-1 text-xs font-semibold rounded-md capitalize transition-all ${
                                    zoom === level
                                        ? 'bg-white dark:bg-primary-900 text-primary-900 dark:text-white shadow-xs'
                                        : 'text-primary-500 dark:text-primary-400 hover:text-primary-900 dark:hover:text-white'
                                }`}
                            >
                                {level}
                            </button>
                        ))}
                    </div>

                    <div className="h-4 w-px bg-primary-200 dark:border-primary-800 mx-1" />

                    <button
                        onClick={expandAll}
                        className="text-xs font-medium text-primary-500 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-200"
                    >
                        Expand All
                    </button>
                    <span className="text-primary-300 dark:text-primary-700">•</span>
                    <button
                        onClick={collapseAll}
                        className="text-xs font-medium text-primary-500 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-200"
                    >
                        Collapse All
                    </button>
                </div>

                <div className="flex items-center gap-3 text-xs text-primary-500 dark:text-primary-400">
                    <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
                        Today: {new Date().toLocaleDateString()}
                    </span>
                    <span>•</span>
                    <span>
                        Span: <strong className="text-primary-700 dark:text-primary-200">{bounds.startStr}</strong> to <strong className="text-primary-700 dark:text-primary-200">{bounds.endStr}</strong> ({bounds.totalDays} days)
                    </span>
                </div>
            </div>

            {/* Split Gantt View: Left fixed side (Sections & Items) + Right scrollable timeline */}
            <div className="flex flex-1 min-h-[500px] overflow-hidden">
                {/* Left Hierarchy Panel */}
                <div className="w-80 sm:w-96 shrink-0 border-r border-primary-200 dark:border-primary-800 flex flex-col bg-white dark:bg-primary-900 z-10">
                    {/* Header */}
                    <div className="h-14 px-4 border-b border-primary-200 dark:border-primary-800 flex items-center justify-between bg-primary-50 dark:bg-black/40">
                        <span className="text-xs font-bold uppercase tracking-wider text-primary-600 dark:text-primary-300">
                            Sections & Items
                        </span>
                        <span className="text-xs text-primary-400">
                            {plan.sections.length} sections / {plan.items.length} items
                        </span>
                    </div>

                    {/* Section and Item Rows */}
                    <div className="flex-1 overflow-y-auto divide-y divide-primary-100 dark:divide-primary-800/60">
                        {plan.sections.map(section => {
                            const isCollapsed = collapsedSections.has(section.id);
                            const sectionItems = itemsBySection.get(section.id) || [];
                            const tagColorClass =
                                (section.tagColor && SECTION_TAG_COLORS[section.tagColor]) ||
                                SECTION_TAG_COLORS.blue;

                            return (
                                <div key={section.id} className="flex flex-col">
                                    {/* Section Header Row */}
                                    <div className="h-11 px-3 flex items-center justify-between gap-2 bg-primary-100/60 dark:bg-primary-800/40 hover:bg-primary-100 dark:hover:bg-primary-800 transition-colors group">
                                        <div
                                            className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer select-none"
                                            onClick={() => toggleSection(section.id)}
                                        >
                                            <button
                                                type="button"
                                                className="text-primary-500 hover:text-primary-700 dark:text-primary-400 p-0.5 rounded"
                                            >
                                                {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                                            </button>
                                            <span className="font-bold text-sm text-primary-900 dark:text-white truncate">
                                                {section.name}
                                            </span>
                                            {section.tag && (
                                                <span
                                                    className={`px-2 py-0.5 text-[11px] font-bold rounded-md border shrink-0 ${tagColorClass}`}
                                                >
                                                    {section.tag}
                                                </span>
                                            )}
                                            <span className="text-xs text-primary-400 shrink-0">
                                                ({sectionItems.length})
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                type="button"
                                                onClick={() => onAddItem(section.id)}
                                                className="p-1 text-secondary-600 hover:text-secondary-700 hover:bg-secondary-50 dark:hover:bg-secondary-950/50 rounded"
                                                title="Add item to section"
                                            >
                                                <Plus size={14} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => onEditSection(section)}
                                                className="p-1 text-primary-500 hover:text-primary-700 dark:text-primary-400 rounded"
                                                title="Edit section"
                                            >
                                                <Edit2 size={13} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => onDeleteSection(section.id)}
                                                className="p-1 text-danger-500 hover:text-danger-700 rounded"
                                                title="Delete section"
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Item Rows */}
                                    {!isCollapsed && (
                                        <div className="divide-y divide-primary-50 dark:divide-primary-800/30">
                                            {sectionItems.length === 0 ? (
                                                <div className="h-10 pl-9 pr-3 flex items-center justify-between text-xs text-primary-400 italic bg-white dark:bg-primary-900">
                                                    <span>No items in section</span>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-xs h-7 py-0 px-2"
                                                        onClick={() => onAddItem(section.id)}
                                                    >
                                                        <Plus size={12} /> Add
                                                    </Button>
                                                </div>
                                            ) : (
                                                sectionItems.map(item => {
                                                    const CatConfig = CATEGORY_COLORS[item.category] || CATEGORY_COLORS.other;
                                                    const CatIcon = CatConfig.icon;
                                                    return (
                                                        <div
                                                            key={item.id}
                                                            className="h-11 pl-8 pr-3 flex items-center justify-between gap-2 hover:bg-primary-50/80 dark:hover:bg-primary-800/30 transition-colors group bg-white dark:bg-primary-900"
                                                        >
                                                            <div
                                                                className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer"
                                                                onClick={() => onEditItem(item)}
                                                            >
                                                                <span
                                                                    className={`p-1 rounded-md shrink-0 text-white ${CatConfig.bg}`}
                                                                    title={item.category}
                                                                >
                                                                    <CatIcon size={12} />
                                                                </span>
                                                                <div className="flex flex-col min-w-0 flex-1">
                                                                    <span className="text-xs font-semibold text-primary-900 dark:text-primary-100 truncate">
                                                                        {item.name}
                                                                    </span>
                                                                    {item.entityName && item.entityName !== item.name && (
                                                                        <span className="text-[10px] text-primary-400 truncate">
                                                                            {item.entityName}
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                {item.dates.length > 1 && (
                                                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary-100 dark:bg-primary-800 text-primary-600 dark:text-primary-300 shrink-0">
                                                                        {item.dates.length} bars
                                                                    </span>
                                                                )}
                                                            </div>

                                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => onEditItem(item)}
                                                                    className="p-1 text-primary-500 hover:text-primary-700 dark:text-primary-400 rounded"
                                                                    title="Edit item"
                                                                >
                                                                    <Edit2 size={12} />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => onDeleteItem(item.id)}
                                                                    className="p-1 text-danger-500 hover:text-danger-700 rounded"
                                                                    title="Delete item"
                                                                >
                                                                    <Trash2 size={12} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Right Scrollable Timeline Panel */}
                <div className="flex-1 overflow-x-auto relative flex flex-col bg-primary-50/20 dark:bg-black/30">
                    <div className="min-w-[800px] flex-1 flex flex-col relative">
                        {/* Timeline Header (Months / Weeks / Days) */}
                        <div className="h-14 border-b border-primary-200 dark:border-primary-800 relative bg-primary-50 dark:bg-black/40 flex select-none">
                            {ticks.map(tick => (
                                <div
                                    key={tick.key}
                                    style={{
                                        position: 'absolute',
                                        left: `${tick.leftPercent}%`,
                                        width: `${tick.widthPercent}%`,
                                    }}
                                    className="h-full border-r border-primary-200/60 dark:border-primary-800/60 px-2 flex flex-col justify-center items-start overflow-hidden text-ellipsis whitespace-nowrap"
                                >
                                    <span className="text-xs font-bold text-primary-800 dark:text-primary-200 truncate w-full">
                                        {tick.label}
                                    </span>
                                    {tick.subLabel && (
                                        <span className="text-[10px] text-primary-400 truncate">
                                            {tick.subLabel}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Background Vertical Gridlines & Today Marker */}
                        <div className="absolute inset-0 top-14 pointer-events-none z-0">
                            {ticks.map(tick => (
                                <div
                                    key={`grid-${tick.key}`}
                                    style={{
                                        position: 'absolute',
                                        left: `${tick.leftPercent}%`,
                                        width: `${tick.widthPercent}%`,
                                    }}
                                    className="h-full border-r border-primary-100 dark:border-primary-800/40"
                                />
                            ))}

                            {/* Today vertical line */}
                            {todayOffset !== null && (
                                <div
                                    style={{ left: `${todayOffset}%` }}
                                    className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20 shadow-sm"
                                >
                                    <div className="sticky top-1 -ml-3.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-500 text-white tracking-wider uppercase">
                                        Today
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Gantt Bar Rows */}
                        <div className="flex-1 divide-y divide-primary-100 dark:divide-primary-800/60 z-10">
                            {plan.sections.map(section => {
                                const isCollapsed = collapsedSections.has(section.id);
                                const sectionItems = itemsBySection.get(section.id) || [];

                                return (
                                    <div key={`timeline-sec-${section.id}`} className="flex flex-col">
                                        {/* Section Row Banner */}
                                        <div className="h-11 relative bg-primary-100/40 dark:bg-primary-800/20" />

                                        {/* Item Rows and Bars */}
                                        {!isCollapsed && (
                                            <div className="divide-y divide-primary-50 dark:divide-primary-800/30">
                                                {sectionItems.length === 0 ? (
                                                    <div className="h-10" />
                                                ) : (
                                                    sectionItems.map(item => {
                                                        const CatConfig = CATEGORY_COLORS[item.category] || CATEGORY_COLORS.other;

                                                        return (
                                                            <div
                                                                key={`bars-${item.id}`}
                                                                className="h-11 relative flex items-center hover:bg-primary-100/30 dark:hover:bg-primary-800/20 transition-colors"
                                                            >
                                                                {/* Render every date interval for this item! */}
                                                                {item.dates.map(dateEntry => {
                                                                    const { leftPercent, widthPercent } = calculateBarPosition(
                                                                        dateEntry.startDate,
                                                                        dateEntry.endDate,
                                                                        bounds.startDate,
                                                                        bounds.totalDays
                                                                    );
                                                                    const days = daysBetween(parseDate(dateEntry.startDate), parseDate(dateEntry.endDate)) + 1;

                                                                    return (
                                                                        <div
                                                                            key={dateEntry.id}
                                                                            onClick={() => onEditItem(item)}
                                                                            style={{
                                                                                left: `${leftPercent}%`,
                                                                                width: `${widthPercent}%`,
                                                                            }}
                                                                            className={`absolute h-7 rounded-lg ${CatConfig.bg} text-white px-2 flex items-center justify-between text-xs font-semibold shadow-xs cursor-pointer hover:brightness-110 transition-all border ${CatConfig.border} group/bar z-10`}
                                                                            title={`${item.name} (${dateEntry.startDate} to ${dateEntry.endDate}, ${days} days)${dateEntry.label ? `\nLabel: ${dateEntry.label}` : ''}${item.comment ? `\nComment: ${item.comment}` : ''}`}
                                                                        >
                                                                            <span className="truncate pr-1 text-[11px]">
                                                                                {dateEntry.label || item.name}
                                                                            </span>
                                                                            <span className="text-[10px] font-medium opacity-80 shrink-0">
                                                                                {days}d
                                                                            </span>

                                                                            {/* Floating Tooltip on Hover */}
                                                                            <div className="hidden group-hover/bar:flex flex-col absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 bg-gray-900 text-white rounded-lg shadow-xl text-xs z-30 pointer-events-none min-w-[180px] border border-gray-700 animate-in fade-in duration-150">
                                                                                <span className="font-bold">{item.name}</span>
                                                                                {dateEntry.label && (
                                                                                    <span className="text-secondary-400 font-medium">{dateEntry.label}</span>
                                                                                )}
                                                                                <span className="text-[11px] text-gray-300 mt-0.5">
                                                                                    {dateEntry.startDate} — {dateEntry.endDate} ({days} days)
                                                                                </span>
                                                                                {item.comment && (
                                                                                    <span className="text-[10px] text-gray-400 mt-1 italic border-t border-gray-800 pt-1">
                                                                                        {item.comment}
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        );
                                                    })
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
