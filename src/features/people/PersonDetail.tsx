import React, { useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useStore } from '../../hooks/useStore';
import { Button } from '../../components/ui/Button';
import { Trash2, ArrowLeft, Loader2, Phone, Mail, Briefcase, Save } from 'lucide-react';
import { useProjects } from '../../hooks/useProjects';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import { useDetailState } from '../../hooks/useDetailState';
import type { Person, PersonType } from '../../types/types';

interface PersonFields {
    name: string;
    description: string;
    type: PersonType;
    role: string;
    phone: string;
    email: string;
    comment: string;
}

const initialPersonFields: PersonFields = {
    name: '',
    description: '',
    type: 'Other' as PersonType,
    role: '',
    phone: '',
    email: '',
    comment: '',
};

export const PersonDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { people, deletePerson, addPerson, updatePerson } = useStore();
    const { activeProjectId } = useProjects();
    const { confirm, confirmDialog } = useConfirmDialog();

    const existingPerson = people.find((p) => p.id === id);
    const isNew = !id || id === 'new';

    const [state, dispatch] = useDetailState(initialPersonFields);
    const { name, description, type, role, phone, email, comment, isDirty, saveStatus } = state;

    const syncedId = useRef('');
    useEffect(() => {
        if (id === syncedId.current) return;
        if (isNew) {
            syncedId.current = id ?? '';
            dispatch({ type: 'RESET' });
        } else if (existingPerson) {
            syncedId.current = id ?? '';
            dispatch({
                type: 'SYNC', payload: {
                    name: existingPerson.name,
                    description: existingPerson.description,
                    type: existingPerson.type,
                    role: existingPerson.role,
                    phone: existingPerson.phone,
                    email: existingPerson.email,
                    comment: existingPerson.comment || '',
                },
            });
        }
    }, [id, existingPerson, isNew, dispatch]);

    if (!existingPerson && !isNew) {
        return <div className="p-8">Person not found</div>;
    }

    const handleSave = async () => {
        if (!name.trim()) return;
        dispatch({ type: 'SET_STATUS', status: 'saving' });
        try {
            if (isNew) {
                if (!activeProjectId) return;
                const newId = crypto.randomUUID();
                const newPerson: Person = {
                    id: newId, projectId: activeProjectId,
                    name, description, type, role, phone, email, comment,
                };
                await addPerson(newPerson);
                dispatch({ type: 'SAVED' });
                navigate(`../${newId}`, { replace: true });
            } else if (existingPerson) {
                const updatedPerson: Person = {
                    ...existingPerson, name, description, type, role, phone, email, comment,
                };
                await updatePerson(updatedPerson);
                dispatch({ type: 'SAVED' });
            }
        } catch (error) {
            console.error('Save failed', error);
            dispatch({ type: 'SET_STATUS', status: 'error' });
        }
    };

    const handleDelete = async () => {
        if (await confirm('Are you sure you want to delete this person?', { title: 'Delete Person', confirmLabel: 'Delete' })) {
            if (existingPerson) deletePerson(existingPerson.id);
            navigate('..');
        }
    };

    return (
        <div className="flex flex-col gap-8 w-full max-w-5xl mx-auto">
            <div className="flex items-center justify-between gap-4">
                <Link
                    to=".."
                    className="inline-flex items-center gap-2 h-8 px-3 -ml-3 text-sm font-semibold rounded-lg transition-colors text-primary-500 hover:text-primary-900 hover:bg-primary-50 dark:text-primary-400 dark:hover:text-primary-100 dark:hover:bg-primary-900/60"
                >
                    <ArrowLeft size={16} /> Back to People
                </Link>
                <div className="flex gap-2 items-center">
                    {saveStatus === 'saving' && (
                        <span className="text-primary-500 text-sm flex items-center gap-1">
                            <Loader2 className="animate-spin" size={14} /> Saving...
                        </span>
                    )}
                    {saveStatus === 'saved' && (
                        <span className="text-green-600 dark:text-green-400 text-sm font-semibold">
                            Saved
                        </span>
                    )}
                    {saveStatus === 'error' && (
                        <span className="text-danger-600 text-sm font-semibold">
                            Error saving
                        </span>
                    )}
                    <Button
                        onClick={handleSave}
                        disabled={!isDirty || !name.trim() || saveStatus === 'saving'}
                        size="sm"
                    >
                        <Save size={16} /> Save
                    </Button>
                    {!isNew && (
                        <>
                            <div className="w-px h-6 bg-primary-200 dark:bg-primary-800 mx-1"></div>
                            <Button variant="danger" onClick={handleDelete} size="sm">
                                <Trash2 size={16} /> Delete
                            </Button>
                        </>
                    )}
                </div>
            </div>

            <input
                type="text"
                value={name}
                onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'name', value: e.target.value })}
                className="text-4xl font-bold text-primary-900 dark:text-white bg-white dark:bg-primary-900 border border-primary-200 dark:border-primary-700 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder-primary-300 dark:placeholder-primary-700 transition-colors hover:border-primary-300 dark:hover:border-primary-600 shadow-sm"
                placeholder="Person Name"
            />

            <div className="grid md:grid-cols-2 gap-8">
                {/* Left Side: Type, Role, Contact */}
                <div className="flex flex-col gap-6">
                    <div className="grid grid-cols-2 gap-4">
                        <section className="flex flex-col gap-2">
                            <h3 className="font-semibold text-primary-900 dark:text-white">Type</h3>
                            <select
                                value={type}
                                onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'type', value: e.target.value as PersonType })}
                                className="bg-white dark:bg-primary-900 border border-primary-200 dark:border-primary-700 rounded-md px-3 py-1.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors hover:border-primary-300 dark:hover:border-primary-600 shadow-sm appearance-none font-semibold text-primary-700 dark:text-primary-300"
                            >
                                <option value="Actor">Actor</option>
                                <option value="Crew">Crew</option>
                                <option value="Other">Other</option>
                            </select>
                        </section>

                        <section className="flex flex-col gap-2">
                            <h3 className="font-semibold text-primary-900 dark:text-white">Role</h3>
                            <div className="relative">
                                <Briefcase size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-400" />
                                <input
                                    type="text"
                                    value={role}
                                    onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'role', value: e.target.value })}
                                    className="bg-white dark:bg-primary-900 border border-primary-200 dark:border-primary-700 rounded-md pl-9 pr-3 py-1.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder-primary-400 transition-colors hover:border-primary-300 dark:hover:border-primary-600 shadow-sm"
                                    placeholder="e.g. Director, Lead"
                                />
                            </div>
                        </section>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <section className="flex flex-col gap-2">
                            <h3 className="font-semibold text-primary-900 dark:text-white">Contact Info</h3>
                            <div className="flex flex-col gap-3">
                                <div className="relative">
                                    <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-400" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'email', value: e.target.value })}
                                        className="bg-white dark:bg-primary-900 border border-primary-200 dark:border-primary-700 rounded-md pl-9 pr-3 py-1.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder-primary-400 transition-colors hover:border-primary-300 dark:hover:border-primary-600 shadow-sm"
                                        placeholder="email@example.com"
                                    />
                                </div>
                                <div className="relative">
                                    <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-400" />
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'phone', value: e.target.value })}
                                        className="bg-white dark:bg-primary-900 border border-primary-200 dark:border-primary-700 rounded-md pl-9 pr-3 py-1.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder-primary-400 transition-colors hover:border-primary-300 dark:hover:border-primary-600 shadow-sm"
                                        placeholder="+1 234 567 890"
                                    />
                                </div>
                            </div>
                        </section>
                    </div>

                    <section className="flex flex-col gap-2">
                        <h3 className="font-semibold text-primary-900 dark:text-white">Internal Notes</h3>
                        <textarea
                            value={comment}
                            onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'comment', value: e.target.value })}
                            className="w-full p-3 rounded-lg bg-white dark:bg-primary-900 border border-primary-200 dark:border-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 hover:border-primary-300 dark:hover:border-primary-600 transition-all min-h-[100px] resize-y shadow-sm"
                            placeholder="Internal notes about availability, agents, etc."
                        />
                    </section>
                </div>

                {/* Right Side: Description */}
                <div className="flex flex-col gap-6">
                    <section className="flex flex-col gap-2 flex-grow">
                        <h3 className="font-semibold text-primary-900 dark:text-white">Bio / Description</h3>
                        <textarea
                            value={description}
                            onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'description', value: e.target.value })}
                            className="w-full p-3 rounded-lg bg-white dark:bg-primary-900 border border-primary-200 dark:border-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 hover:border-primary-300 dark:hover:border-primary-600 transition-all min-h-[250px] resize-y shadow-sm flex-grow"
                            placeholder="Short biography or description..."
                        />
                    </section>
                </div>
            </div>
            {confirmDialog}
        </div>
    );
};
