import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Trash2, ArrowLeft, Save, Clock } from 'lucide-react';
import { useStore } from '../../hooks/useStore';
import type { Schedule, ScheduleItem, ScheduleItemType, SpecialItemType } from '../../types/types';

export const ScheduleForm: React.FC = () => {
    const { projectId, scheduleId } = useParams<{ projectId: string; scheduleId: string }>();
    const navigate = useNavigate();
    const { schedules, scenes, addSchedule, updateSchedule } = useStore();

    const [name, setName] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [notes, setNotes] = useState('');
    const [items, setItems] = useState<ScheduleItem[]>([]);

    // Get all shots from all scenes
    const allShots = scenes.flatMap(scene => 
        (scene.shots || []).map(shot => ({
            ...shot,
            sceneNumber: scene.number,
            sceneName: scene.name
        }))
    );

    useEffect(() => {
        if (scheduleId && schedules.length > 0) {
            const existing = schedules.find(s => s.id === scheduleId);
            if (existing) {
                setName(existing.name);
                setDate(existing.date);
                setNotes(existing.notes || '');
                setItems(existing.items);
            }
        }
    }, [scheduleId, schedules]);

    const handleAddItem = () => {
        const newItem: ScheduleItem = {
            id: crypto.randomUUID(),
            time: '08:00',
            duration: 30,
            type: 'special',
            specialType: 'other',
            notes: ''
        };
        setItems([...items, newItem]);
    };

    const handleRemoveItem = (id: string) => {
        setItems(items.filter(item => item.id !== id));
    };

    const handleUpdateItem = (id: string, updates: Partial<ScheduleItem>) => {
        setItems(items.map(item => item.id === id ? { ...item, ...updates } : item));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!projectId) return;

        const scheduleData: Schedule = {
            id: scheduleId || crypto.randomUUID(),
            projectId,
            name,
            date,
            notes,
            items,
            createdAt: scheduleId ? (schedules.find(s => s.id === scheduleId)?.createdAt || Date.now()) : Date.now(),
            updatedAt: Date.now()
        };

        if (scheduleId) {
            await updateSchedule(scheduleData);
        } else {
            await addSchedule(scheduleData);
        }

        navigate(`/project/${projectId}/scheduling`);
    };

    const specialTypes: SpecialItemType[] = ['break', 'lunch', 'set up', 'call time', 'wrap out', 'other'];

    return (
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-primary-100 dark:hover:bg-primary-800 rounded-full transition-colors text-primary-600 dark:text-primary-400"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="text-2xl font-bold text-primary-900 dark:text-white">
                        {scheduleId ? 'Edit Schedule' : 'Add New Schedule'}
                    </h1>
                </div>
                <button
                    type="submit"
                    className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg transition-colors font-medium shadow-sm"
                >
                    <Save size={20} />
                    Save Schedule
                </button>
            </div>

            <div className="space-y-6">
                {/* Basic Info */}
                <div className="bg-white dark:bg-primary-900 p-6 rounded-xl border border-primary-200 dark:border-primary-800 shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-primary-700 dark:text-primary-300 mb-2">
                                Schedule Name
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-primary-50 dark:bg-primary-800 border border-primary-200 dark:border-primary-700 rounded-lg px-4 py-2 text-primary-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                                placeholder="Day 1 - Shooting"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-primary-700 dark:text-primary-300 mb-2">
                                Date
                            </label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full bg-primary-50 dark:bg-primary-800 border border-primary-200 dark:border-primary-700 rounded-lg px-4 py-2 text-primary-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                                required
                            />
                        </div>
                    </div>
                    <div className="mt-6">
                        <label className="block text-sm font-medium text-primary-700 dark:text-primary-300 mb-2">
                            Notes
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full bg-primary-50 dark:bg-primary-800 border border-primary-200 dark:border-primary-700 rounded-lg px-4 py-2 text-primary-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none h-24 resize-none"
                            placeholder="General notes for this shoot day..."
                        />
                    </div>
                </div>

                {/* Schedule Items */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-primary-900 dark:text-white flex items-center gap-2">
                            <Clock size={20} className="text-primary-400" />
                            Timeline Items
                        </h2>
                        <button
                            type="button"
                            onClick={handleAddItem}
                            className="text-sm flex items-center gap-1 text-primary-600 hover:text-primary-700 font-medium"
                        >
                            <Plus size={16} />
                            Add Item
                        </button>
                    </div>

                    {items.length === 0 ? (
                        <div className="bg-primary-50 dark:bg-primary-900/30 border-2 border-dashed border-primary-200 dark:border-primary-800 rounded-xl p-8 text-center text-primary-400">
                            Add the first item to your timeline.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {items.map((item) => (
                                <div 
                                    key={item.id}
                                    className="bg-white dark:bg-primary-900 p-4 rounded-xl border border-primary-200 dark:border-primary-800 shadow-sm flex flex-col md:flex-row gap-4 items-start"
                                >
                                    <div className="flex-none w-full md:w-32">
                                        <label className="block text-[10px] uppercase tracking-wider font-bold text-primary-400 mb-1">Time</label>
                                        <input
                                            type="time"
                                            value={item.time}
                                            onChange={(e) => handleUpdateItem(item.id, { time: e.target.value })}
                                            className="w-full bg-primary-50 dark:bg-primary-800 border-none rounded-lg px-2 py-1.5 text-sm"
                                        />
                                    </div>
                                    <div className="flex-none w-full md:w-24">
                                        <label className="block text-[10px] uppercase tracking-wider font-bold text-primary-400 mb-1">Dur (min)</label>
                                        <input
                                            type="number"
                                            value={item.duration}
                                            onChange={(e) => handleUpdateItem(item.id, { duration: parseInt(e.target.value) || 0 })}
                                            className="w-full bg-primary-50 dark:bg-primary-800 border-none rounded-lg px-2 py-1.5 text-sm"
                                        />
                                    </div>
                                    <div className="flex-none w-full md:w-32">
                                        <label className="block text-[10px] uppercase tracking-wider font-bold text-primary-400 mb-1">Type</label>
                                        <select
                                            value={item.type}
                                            onChange={(e) => handleUpdateItem(item.id, { 
                                                type: e.target.value as ScheduleItemType,
                                                shotId: e.target.value === 'shot' ? (allShots[0]?.id || '') : undefined,
                                                specialType: e.target.value === 'special' ? 'other' : undefined
                                            })}
                                            className="w-full bg-primary-50 dark:bg-primary-800 border-none rounded-lg px-2 py-1.5 text-sm"
                                        >
                                            <option value="shot">Shot</option>
                                            <option value="special">Special</option>
                                        </select>
                                    </div>
                                    <div className="flex-1 w-full">
                                        <label className="block text-[10px] uppercase tracking-wider font-bold text-primary-400 mb-1">
                                            {item.type === 'shot' ? 'Select Shot' : 'Event Type'}
                                        </label>
                                        {item.type === 'shot' ? (
                                            <select
                                                value={item.shotId}
                                                onChange={(e) => handleUpdateItem(item.id, { shotId: e.target.value })}
                                                className="w-full bg-primary-50 dark:bg-primary-800 border-none rounded-lg px-2 py-1.5 text-sm"
                                            >
                                                <option value="">Select a shot...</option>
                                                {allShots.map(shot => (
                                                    <option key={shot.id} value={shot.id}>
                                                        Scene {shot.sceneNumber}: {shot.name}
                                                    </option>
                                                ))}
                                            </select>
                                        ) : (
                                            <select
                                                value={item.specialType}
                                                onChange={(e) => handleUpdateItem(item.id, { specialType: e.target.value as SpecialItemType })}
                                                className="w-full bg-primary-50 dark:bg-primary-800 border-none rounded-lg px-2 py-1.5 text-sm capitalize"
                                            >
                                                {specialTypes.map(type => (
                                                    <option key={type} value={type}>{type}</option>
                                                ))}
                                            </select>
                                        )}
                                    </div>
                                    <div className="flex-1 w-full">
                                        <label className="block text-[10px] uppercase tracking-wider font-bold text-primary-400 mb-1">Notes</label>
                                        <input
                                            type="text"
                                            value={item.notes}
                                            onChange={(e) => handleUpdateItem(item.id, { notes: e.target.value })}
                                            className="w-full bg-primary-50 dark:bg-primary-800 border-none rounded-lg px-2 py-1.5 text-sm"
                                            placeholder="Item notes..."
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveItem(item.id)}
                                        className="mt-6 p-2 text-primary-400 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            
            <div className="mt-8 pt-8 border-t border-primary-200 dark:border-primary-800 flex justify-end">
                <button
                    type="submit"
                    className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-xl transition-colors font-semibold shadow-lg shadow-primary-500/20"
                >
                    <Save size={20} />
                    {scheduleId ? 'Update Schedule' : 'Create Schedule'}
                </button>
            </div>
        </form>
    );
};
