import React from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Plus, Calendar as CalendarIcon } from 'lucide-react';
import { useStore } from '../../hooks/useStore';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import { ScheduleForm } from './ScheduleForm';
import { EmptyState } from '../../components/ui/EmptyState';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

export const SchedulingPage: React.FC = () => {
    const navigate = useNavigate();
    const { schedules, deleteSchedule } = useStore();
    const { confirm, confirmDialog } = useConfirmDialog();

    const handleDeleteSchedule = async (e: React.MouseEvent, scheduleId: string) => {
        e.stopPropagation();
        if (await confirm('Are you sure you want to delete this schedule?', { title: 'Delete Schedule', confirmLabel: 'Delete' })) {
            deleteSchedule(scheduleId);
        }
    };

    return (
        <Routes>
            <Route index element={
                <>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-3xl font-bold text-primary-900 dark:text-white">Scheduling</h2>
                        <Button onClick={() => navigate('new')}>
                            <Plus size={18} /> Add schedule
                        </Button>
                    </div>

                    {schedules.length === 0 ? (
                        <EmptyState
                            icon={<CalendarIcon size={48} />}
                            message="No schedules yet"
                            description="Organize your shoot days by creating a schedule with shots and special events."
                            action={
                                <Button onClick={() => navigate('new')}>
                                    <Plus size={18} /> Add your first schedule
                                </Button>
                            }
                        />
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {schedules.map(schedule => (
                                <Card
                                    key={schedule.id}
                                    hoverable
                                    className="cursor-pointer group"
                                    onClick={() => navigate(schedule.id)}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-semibold text-lg text-primary-900 dark:text-white group-hover:text-secondary-600 dark:group-hover:text-secondary-400 transition-colors">
                                            {schedule.name}
                                        </h3>
                                        <span className="text-xs font-semibold px-2 py-1 bg-primary-100 dark:bg-primary-800 text-primary-600 dark:text-primary-400 rounded-full shrink-0 ml-2">
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
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => handleDeleteSchedule(e, schedule.id)}
                                            className="text-danger-500 hover:text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-950/30"
                                        >
                                            Delete
                                        </Button>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                    {confirmDialog}
                </>
            } />
            <Route path="new" element={<ScheduleForm />} />
            <Route path=":scheduleId" element={<ScheduleForm />} />
        </Routes>
    );
};
