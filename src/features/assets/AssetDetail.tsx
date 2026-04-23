import React, { useReducer, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useStore } from '../../hooks/useStore';
import { Button } from '../../components/ui/Button';
import { Trash2, ArrowLeft, Loader2, Save } from 'lucide-react';
import { useProjects } from '../../hooks/useProjects';
import type { Asset, AssetType } from '../../types/types';
import { User } from 'lucide-react';

export const AssetDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { assets, deleteAsset, addAsset, updateAsset, people } = useStore();
    const { activeProjectId } = useProjects();

    const existingAsset = assets.find((a) => a.id === id);
    const isNew = !id || id === 'new';

    interface AssetState {
        name: string;
        description: string;
        type: AssetType;
        ownerId: string;
        comment: string;
        isDirty: boolean;
        saveStatus: 'saved' | 'saving' | 'error' | null;
    }

    type AssetAction =
        | { type: 'SET_FIELD'; field: string; value: string | AssetType }
        | { type: 'SET_STATUS'; status: 'saved' | 'saving' | 'error' | null }
        | { type: 'SAVED' }
        | { type: 'SYNC'; payload: Omit<AssetState, 'isDirty' | 'saveStatus'> }
        | { type: 'RESET' };

    const [state, dispatch] = useReducer((state: AssetState, action: AssetAction): AssetState => {
        switch (action.type) {
            case 'SET_FIELD':
                return { ...state, [action.field]: action.value, isDirty: true, saveStatus: null };
            case 'SET_STATUS':
                return { ...state, saveStatus: action.status };
            case 'SAVED':
                return { ...state, saveStatus: 'saved', isDirty: false };
            case 'SYNC':
                return { ...state, ...action.payload, isDirty: false, saveStatus: null };
            case 'RESET':
                return {
                    name: '', description: '', type: 'Other' as AssetType,
                    ownerId: '', comment: '',
                    isDirty: false, saveStatus: null
                };
            default:
                return state;
        }
    }, {
        name: '', description: '', type: 'Other' as AssetType,
        ownerId: '', comment: '',
        isDirty: false, saveStatus: null
    });

    const { name, description, type, ownerId, comment, isDirty, saveStatus } = state;

    useEffect(() => {
        if (existingAsset) {
            dispatch({
                type: 'SYNC', payload: {
                    name: existingAsset.name,
                    description: existingAsset.description,
                    type: existingAsset.type,
                    ownerId: existingAsset.ownerId ?? '',
                    comment: existingAsset.comment || ''
                }
            });
        } else if (isNew) {
            dispatch({ type: 'RESET' });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    if (!existingAsset && !isNew) {
        return <div className="p-8">Asset not found</div>;
    }

    const handleSave = async () => {
        if (!name.trim()) return;
        dispatch({ type: 'SET_STATUS', status: 'saving' });
        try {
            if (isNew) {
                if (!activeProjectId) return;
                const newId = crypto.randomUUID();
                const newAsset: Asset = {
                    id: newId, projectId: activeProjectId,
                    name, description, type, comment,
                    ...(ownerId ? { ownerId } : {})
                };
                await addAsset(newAsset);
                dispatch({ type: 'SAVED' });
                navigate(`../${newId}`, { replace: true });
            } else if (existingAsset) {
                const { ownerId: _old, ...base } = existingAsset;
                const updatedAsset: Asset = {
                    ...base, name, description, type, comment,
                    ...(ownerId ? { ownerId } : {})
                };
                await updateAsset(updatedAsset);
                dispatch({ type: 'SAVED' });
            }
        } catch (error) {
            console.error('Save failed', error);
            dispatch({ type: 'SET_STATUS', status: 'error' });
        }
    };

    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this asset?')) {
            if (existingAsset) deleteAsset(existingAsset.id);
            navigate('..');
        }
    };

    return (
        <div className="flex flex-col gap-8 w-full max-w-5xl mx-auto">
            <div>
                <Link
                    to=".."
                    className="inline-flex items-center gap-2 h-8 px-3 -ml-3 text-sm font-semibold rounded-lg transition-colors text-primary-500 hover:text-primary-900 hover:bg-primary-50 dark:text-primary-400 dark:hover:text-primary-100 dark:hover:bg-primary-900/60"
                >
                    <ArrowLeft size={16} /> Back to Assets
                </Link>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start gap-4 pb-6 border-b border-primary-200 dark:border-primary-800">
                <div className="flex-1 w-full">
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'name', value: e.target.value })}
                        className="text-4xl font-bold text-primary-900 dark:text-white mb-2 bg-white dark:bg-primary-900 border border-primary-200 dark:border-primary-700 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder-primary-300 dark:placeholder-primary-700 transition-colors hover:border-primary-300 dark:hover:border-primary-600 shadow-sm"
                        placeholder="Asset Name"
                    />
                </div>
                <div className="flex gap-2 items-center flex-wrap justify-end">
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

            <div className="grid md:grid-cols-2 gap-8">
                {/* Left Side: Type & Owner */}
                <div className="flex flex-col gap-6">
                    <section className="flex flex-col gap-2">
                        <h3 className="font-semibold text-primary-900 dark:text-white">Type</h3>
                        <select
                            value={type}
                            onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'type', value: e.target.value as AssetType })}
                            className="bg-white dark:bg-primary-900 border border-primary-200 dark:border-primary-700 rounded-md px-3 py-1.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors hover:border-primary-300 dark:hover:border-primary-600 shadow-sm appearance-none font-semibold text-primary-700 dark:text-primary-300"
                        >
                            <option value="Equipment">Equipment</option>
                            <option value="Props">Props</option>
                            <option value="Expendables">Expendables</option>
                            <option value="Other">Other</option>
                        </select>
                    </section>

                    <section className="flex flex-col gap-2">
                        <h3 className="font-semibold text-primary-900 dark:text-white">Owner</h3>
                        <div className="relative">
                            <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-400" />
                            <select
                                value={ownerId}
                                onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'ownerId', value: e.target.value })}
                                className="bg-white dark:bg-primary-900 border border-primary-200 dark:border-primary-700 rounded-md pl-9 pr-3 py-1.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors hover:border-primary-300 dark:hover:border-primary-600 shadow-sm appearance-none text-primary-700 dark:text-primary-300"
                            >
                                <option value="">— No owner —</option>
                                {people.map((p) => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                    </section>

                    <section className="flex flex-col gap-2">
                        <h3 className="font-semibold text-primary-900 dark:text-white">Internal Notes</h3>
                        <textarea
                            value={comment}
                            onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'comment', value: e.target.value })}
                            className="w-full p-3 rounded-lg bg-white dark:bg-primary-900 border border-primary-200 dark:border-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 hover:border-primary-300 dark:hover:border-primary-600 transition-all min-h-[100px] resize-y shadow-sm"
                            placeholder="Internal notes..."
                        />
                    </section>
                </div>

                {/* Right Side: Description */}
                <div className="flex flex-col gap-6">
                    <section className="flex flex-col gap-2 flex-grow">
                        <h3 className="font-semibold text-primary-900 dark:text-white">Description</h3>
                        <textarea
                            value={description}
                            onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'description', value: e.target.value })}
                            className="w-full p-3 rounded-lg bg-white dark:bg-primary-900 border border-primary-200 dark:border-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 hover:border-primary-300 dark:hover:border-primary-600 transition-all min-h-[200px] resize-y shadow-sm flex-grow"
                            placeholder="Detailed description of the asset..."
                        />
                    </section>
                </div>
            </div>
        </div>
    );
};
