import React from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Plus, Calendar as CalendarIcon } from 'lucide-react';
import { useStore } from '../../hooks/useStore';
import { ScheduleForm } from './ScheduleForm';
import { EmptyState } from '../../components/ui/EmptyState';

export const SchedulingPage: React.FC = () => {
    const navigate = useNavigate();
    const { schedules, deleteSchedule } = useStore();

    return (
        <div className="p-6">
            <Routes>
                <Route index element={
                    <>
                        <div className="flex justify-between items-center mb-6">
                            <h1 className="text-2xl font-bold text-primary-900 dark:text-white">Scheduling</h1>
                            <button
                                onClick={() => navigate('new')}
                                className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm"
                            >
                                <Plus size={20} />
                                Add schedule
                            </button>
                        </div>

                        {schedules.length === 0 ? (
                            <EmptyState
                                icon={<CalendarIcon size={48} />}
                                message="No schedules yet"
                                description="Organize your shoot days by creating a schedule with shots and special events."
                                action={
                                    <button
                                        onClick={() => navigate('new')}
                                        className="inline-flex items-center gap-2 text-primary-600 dark:text-primary-400 font-medium hover:underline"
                                    >
                                        <Plus size={20} />
                                        Add your first schedule
                                    </button>
                                }
                            />
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {schedules.map(schedule => (
                                    <div 
                                        key={schedule.id}
                                        className="bg-white dark:bg-primary-900 rounded-xl border border-primary-200 dark:border-primary-800 overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                                        onClick={() => navigate(schedule.id)}
                                    >
                                        <div className="p-5">
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="font-semibold text-lg text-primary-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                                    {schedule.name}
                                                </h3>
                                                <span className="text-xs font-medium px-2 py-1 bg-primary-100 dark:bg-primary-800 text-primary-600 dark:text-primary-400 rounded-full">
                                                    {new Date(schedule.date).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <p className="text-sm text-primary-500 dark:text-primary-400 line-clamp-2 mb-4">
                                                {schedule.notes || 'No notes available.'}
                                            </p>
                                            <div className="flex items-center justify-between mt-auto pt-4 border-t border-primary-100 dark:border-primary-800">
                                                <span className="text-xs text-primary-400">
                                                    {schedule.items.length} items
                                                </span>
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (window.confirm('Are you sure you want to delete this schedule?')) {
                                                            deleteSchedule(schedule.id);
                                                        }
                                                    }}
                                                    className="text-xs text-red-500 hover:text-red-600 transition-colors"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                } />
                <Route path="new" element={<ScheduleForm />} />
                <Route path=":scheduleId" element={<ScheduleForm />} />
            </Routes>
        </div>
    );
};
