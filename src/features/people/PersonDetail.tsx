import React, { useReducer, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useStore } from '../../hooks/useStore';
import { Button } from '../../components/ui/Button';
import { Trash2, ArrowLeft, Loader2, Phone, Mail, Briefcase } from 'lucide-react';
import { useProjects } from '../../hooks/useProjects';
import { useDebounce } from '../../hooks/useDebounce';
import type { Person, PersonType } from '../../types/types';

export const PersonDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { people, deletePerson, addPerson, updatePerson } = useStore();
    const { activeProjectId } = useProjects();

    // Derived state
    const existingPerson = people.find((p) => p.id === id);
    const isNew = !id || id === 'new';

    interface PersonState {
        name: string;
        description: string;
        type: PersonType;
        role: string;
        phone: string;
        email: string;
        comment: string;
        isDirty: boolean;
        saveStatus: 'saved' | 'saving' | 'error' | null;
    }

    type PersonAction = 
        | { type: 'SET_FIELD'; field: string; value: string | number | boolean | string[] | undefined | PersonType }
        | { type: 'SET_MULTIPLE'; payload: Partial<PersonState> }
        | { type: 'SET_STATUS'; status: 'saved' | 'saving' | 'error' | null }
        | { type: 'SAVED' }
        | { type: 'SYNC'; payload: Partial<PersonState> }
        | { type: 'RESET' };

    // Local state for editing using a reducer
    const [state, dispatch] = useReducer((state: PersonState, action: PersonAction): PersonState => {
        switch (action.type) {
            case 'SET_FIELD':
                return { ...state, [action.field]: action.value, isDirty: true, saveStatus: null };
            case 'SET_MULTIPLE':
                return { ...state, ...action.payload, isDirty: true, saveStatus: null };
            case 'SET_STATUS':
                return { ...state, saveStatus: action.status };
            case 'SAVED':
                return { ...state, saveStatus: 'saved', isDirty: false };
            case 'SYNC':
                return { ...state, ...action.payload, isDirty: false };
            case 'RESET':
                return {
                    name: '',
                    description: '',
                    type: 'Other' as PersonType,
                    role: '',
                    phone: '',
                    email: '',
                    comment: '',
                    isDirty: false,
                    saveStatus: null
                };
            default:
                return state;
        }
    }, {
        name: '',
        description: '',
        type: 'Other' as PersonType,
        role: '',
        phone: '',
        email: '',
        comment: '',
        isDirty: false,
        saveStatus: null
    });

    const { name, description, type, role, phone, email, comment, isDirty, saveStatus } = state;

    const debouncedName = useDebounce(name, 1000);
    const debouncedDescription = useDebounce(description, 1000);
    const debouncedRole = useDebounce(role, 1000);
    const debouncedPhone = useDebounce(phone, 1000);
    const debouncedEmail = useDebounce(email, 1000);
    const debouncedComment = useDebounce(comment, 1000);

    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Initial load and sync
    useEffect(() => {
        if (existingPerson) {
            const payload = {
                name: existingPerson.name,
                description: existingPerson.description,
                type: existingPerson.type,
                role: existingPerson.role,
                phone: existingPerson.phone,
                email: existingPerson.email,
                comment: existingPerson.comment || ''
            };

            const needsSync = 
                payload.name !== name ||
                payload.description !== description ||
                payload.type !== type ||
                payload.role !== role ||
                payload.phone !== phone ||
                payload.email !== email ||
                payload.comment !== comment;

            if (needsSync && !isDirty) {
                dispatch({ type: 'SYNC', payload });
            }
        } else if (isNew) {
            dispatch({ type: 'RESET' });
        }
    }, [existingPerson, isNew, name, description, type, role, phone, email, comment, isDirty]);

    // Handle initial creation for "new" route
    useEffect(() => {
        if (isNew && debouncedName.trim() && activeProjectId) {
            const createPerson = async () => {
                const newId = crypto.randomUUID();
                const newPerson: Person = {
                    id: newId,
                    projectId: activeProjectId,
                    name: name,
                    description: description,
                    type: type,
                    role: role,
                    phone: phone,
                    email: email,
                    comment: comment,
                };
                await addPerson(newPerson);
                navigate(`../${newId}`, { replace: true });
            };
            createPerson();
        }
    }, [debouncedName, isNew, activeProjectId, addPerson, navigate, name, description, type, role, phone, email, comment]);

    // Auto-save effect for existing people
    useEffect(() => {
        if (isNew || !existingPerson || !isDirty) return;
        if (!debouncedName.trim()) return;

        const save = async () => {
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
            dispatch({ type: 'SET_STATUS', status: 'saving' });

            try {
                const updatedPerson: Person = {
                    ...existingPerson,
                    name: debouncedName,
                    description: debouncedDescription,
                    type: type,
                    role: debouncedRole,
                    phone: debouncedPhone,
                    email: debouncedEmail,
                    comment: debouncedComment,
                };

                await updatePerson(updatedPerson);
                dispatch({ type: 'SAVED' });
                saveTimeoutRef.current = setTimeout(() => {
                    dispatch({ type: 'SET_STATUS', status: null });
                }, 2000);
            } catch (error) {
                console.error("Auto-save failed", error);
                dispatch({ type: 'SET_STATUS', status: 'error' });
            }
        };

        save();
    }, [debouncedName, debouncedDescription, debouncedRole, debouncedPhone, debouncedEmail, debouncedComment, type, existingPerson, isNew, isDirty, updatePerson]);

    if (!existingPerson && !isNew) {
        return <div className="p-8">Person not found</div>;
    }

    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this person?')) {
            if (existingPerson) deletePerson(existingPerson.id);
            navigate('..');
        }
    };

    return (
        <div className="flex flex-col gap-8 w-full max-w-5xl mx-auto">
            <div>
                <Link
                    to=".."
                    className="inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none hover:bg-primary-100 dark:hover:bg-primary-800 text-primary-500 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-100 h-8 px-3 text-sm -ml-3 gap-2"
                >
                    <ArrowLeft size={16} /> Back to People
                </Link>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start gap-4 pb-6 border-b border-primary-200 dark:border-primary-800">
                <div className="flex-1 w-full">
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'name', value: e.target.value })}
                        className="text-4xl font-bold text-primary-900 dark:text-white mb-2 bg-white dark:bg-primary-900 border border-primary-200 dark:border-primary-700 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-primary-300 dark:placeholder-primary-700 transition-colors hover:border-primary-300 dark:hover:border-primary-600 shadow-sm"
                        placeholder="Person Name"
                    />
                </div>
                <div className="flex gap-2 items-center flex-wrap justify-end">
                    {saveStatus === 'saving' && (
                        <span className="text-primary-500 text-sm flex items-center gap-1">
                            <Loader2 className="animate-spin" size={14} /> Saving...
                        </span>
                    )}
                    {saveStatus === 'saved' && (
                        <span className="text-green-600 dark:text-green-400 text-sm flex items-center gap-1 font-medium transition-opacity duration-500">
                            Saved
                        </span>
                    )}
                    {saveStatus === 'error' && (
                        <span className="text-danger-600 text-sm font-medium">
                            Error saving
                        </span>
                    )}
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

            <div className="grid md:grid-cols-2 gap-8">
                {/* Left Side: Type, Role, Contact */}
                <div className="flex flex-col gap-6">
                    <div className="grid grid-cols-2 gap-4">
                        <section className="flex flex-col gap-2">
                            <h3 className="font-semibold text-primary-900 dark:text-white">Type</h3>
                            <select
                                value={type}
                                onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'type', value: e.target.value as PersonType })}
                                className="bg-white dark:bg-primary-900 border border-primary-200 dark:border-primary-700 rounded-md px-3 py-1.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors hover:border-primary-300 dark:hover:border-primary-600 shadow-sm appearance-none font-medium text-primary-700 dark:text-primary-300"
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
                                    className="bg-white dark:bg-primary-900 border border-primary-200 dark:border-primary-700 rounded-md pl-9 pr-3 py-1.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-primary-400 transition-colors hover:border-primary-300 dark:hover:border-primary-600 shadow-sm"
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
                                        className="bg-white dark:bg-primary-900 border border-primary-200 dark:border-primary-700 rounded-md pl-9 pr-3 py-1.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-primary-400 transition-colors hover:border-primary-300 dark:hover:border-primary-600 shadow-sm"
                                        placeholder="email@example.com"
                                    />
                                </div>
                                <div className="relative">
                                    <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-400" />
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'phone', value: e.target.value })}
                                        className="bg-white dark:bg-primary-900 border border-primary-200 dark:border-primary-700 rounded-md pl-9 pr-3 py-1.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-primary-400 transition-colors hover:border-primary-300 dark:hover:border-primary-600 shadow-sm"
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
                            className="w-full p-3 rounded-lg bg-white dark:bg-primary-900 border border-primary-200 dark:border-primary-700 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-primary-300 dark:hover:border-primary-600 transition-all min-h-[100px] resize-y shadow-sm"
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
                            className="w-full p-3 rounded-lg bg-white dark:bg-primary-900 border border-primary-200 dark:border-primary-700 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-primary-300 dark:hover:border-primary-600 transition-all min-h-[250px] resize-y shadow-sm flex-grow"
                            placeholder="Short biography or description..."
                        />
                    </section>
                </div>
            </div>
        </div>
    );
};
