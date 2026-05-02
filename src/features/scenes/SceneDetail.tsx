import React, { useReducer, useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useStore } from '../../hooks/useStore';
import { useProjects } from '../../hooks/useProjects';
import { Button } from '../../components/ui/Button';
import { Trash2, ArrowLeft, Loader2, Save, MapPin, ChevronDown, ChevronRight, X, Search, Clapperboard, Info } from 'lucide-react';
import { Tooltip } from '../../components/ui/Tooltip';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import type { Scene } from '../../types/types';

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

interface SceneState {
    name: string;
    number: string;
    description: string;
    comment: string;
    locationId: string;
    length: string;
    characters: string[];
    peopleIds: string[];
    assetIds: string[];
    isDirty: boolean;
    saveStatus: 'saved' | 'saving' | 'error' | null;
}

type SceneAction =
    | { type: 'SET_FIELD'; field: string; value: string }
    | { type: 'TOGGLE_ID'; field: 'characters' | 'peopleIds' | 'assetIds'; id: string }
    | { type: 'SET_STATUS'; status: 'saved' | 'saving' | 'error' | null }
    | { type: 'SAVED' }
    | { type: 'SYNC'; payload: Omit<SceneState, 'isDirty' | 'saveStatus'> };

function sceneReducer(state: SceneState, action: SceneAction): SceneState {
    switch (action.type) {
        case 'SET_FIELD':
            return { ...state, [action.field]: action.value, isDirty: true, saveStatus: null };
        case 'TOGGLE_ID': {
            const arr = state[action.field];
            const next = arr.includes(action.id)
                ? arr.filter(id => id !== action.id)
                : [...arr, action.id];
            return { ...state, [action.field]: next, isDirty: true, saveStatus: null };
        }
        case 'SET_STATUS':
            return { ...state, saveStatus: action.status };
        case 'SAVED':
            return { ...state, saveStatus: 'saved', isDirty: false };
        case 'SYNC':
            return { ...state, ...action.payload, isDirty: false, saveStatus: null };
        default:
            return state;
    }
}

const initialState: SceneState = {
    name: '', number: '', description: '', comment: '',
    locationId: '', length: '', characters: [], peopleIds: [], assetIds: [],
    isDirty: false, saveStatus: null,
};

// ---------------------------------------------------------------------------
// Collapsible section header
// ---------------------------------------------------------------------------

const SectionHeader: React.FC<{ title: string; isOpen: boolean; onToggle: () => void }> = ({ title, isOpen, onToggle }) => (
    <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-2 pb-3 border-b border-primary-200 dark:border-primary-800 group"
    >
        {isOpen
            ? <ChevronDown size={16} className="text-primary-400 group-hover:text-primary-600 dark:group-hover:text-primary-300 transition-colors shrink-0" />
            : <ChevronRight size={16} className="text-primary-400 group-hover:text-primary-600 dark:group-hover:text-primary-300 transition-colors shrink-0" />
        }
        <h2 className="text-lg font-bold text-primary-900 dark:text-white">{title}</h2>
    </button>
);

// ---------------------------------------------------------------------------
// Searchable multi-select
// ---------------------------------------------------------------------------

interface MultiSelectProps {
    allItems: { id: string; name: string }[];
    selectedIds: string[];
    onToggle: (id: string) => void;
    placeholder?: string;
    emptyMessage?: string;
}

const MultiSelect: React.FC<MultiSelectProps> = ({ allItems, selectedIds, onToggle, placeholder = 'Search…', emptyMessage = 'Nothing here yet.' }) => {
    const [query, setQuery] = useState('');
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
                setQuery('');
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const selected = allItems.filter(item => selectedIds.includes(item.id));
    const unselected = allItems.filter(item => !selectedIds.includes(item.id));
    const filtered = unselected.filter(item =>
        item.name.toLowerCase().includes(query.toLowerCase())
    );

    if (allItems.length === 0) {
        return <p className="text-sm text-primary-400">{emptyMessage}</p>;
    }

    const showPlaceholder = selected.length === 0 && !query;

    return (
        <div ref={containerRef} className="relative">
            {/* Unified tag + input field */}
            <div
                className={`flex flex-wrap items-center gap-1.5 min-h-[38px] w-full px-2.5 py-1.5 bg-white dark:bg-primary-900 border rounded-lg shadow-sm transition-colors cursor-text ${open ? 'border-primary-500 ring-2 ring-primary-500/30' : 'border-primary-200 dark:border-primary-700 hover:border-primary-300 dark:hover:border-primary-600'}`}
                onMouseDown={(e) => {
                    if (e.target === e.currentTarget) {
                        e.preventDefault();
                        inputRef.current?.focus();
                    }
                }}
            >
                {selected.map(item => (
                    <span
                        key={item.id}
                        className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-700 dark:text-primary-100 border border-primary-200 dark:border-primary-600"
                    >
                        {item.name}
                        <button
                            type="button"
                            onMouseDown={(e) => {
                                e.preventDefault();
                                onToggle(item.id);
                            }}
                            className="flex items-center justify-center w-3.5 h-3.5 rounded-full hover:bg-primary-200 dark:hover:bg-primary-600 transition-colors"
                            aria-label={`Remove ${item.name}`}
                        >
                            <X size={9} />
                        </button>
                    </span>
                ))}
                <div className="relative flex items-center flex-1 min-w-[80px]">
                    {showPlaceholder && (
                        <Search size={12} className="absolute left-0 text-primary-400 pointer-events-none" />
                    )}
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        placeholder={showPlaceholder ? placeholder : ''}
                        onFocus={() => setOpen(true)}
                        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
                        className={`w-full bg-transparent border-none outline-none text-sm text-primary-900 dark:text-white placeholder-primary-400 ${showPlaceholder ? 'pl-5' : ''}`}
                    />
                </div>
            </div>

            {/* Dropdown */}
            {open && (
                <div className="absolute z-20 top-full mt-1 w-full max-h-48 overflow-y-auto rounded-lg border border-primary-200 dark:border-primary-700 bg-white dark:bg-primary-900 shadow-lg">
                    {filtered.length === 0 ? (
                        <p className="px-3 py-2 text-sm text-primary-400">
                            {query ? 'No matches' : 'All items selected'}
                        </p>
                    ) : (
                        filtered.map(item => (
                            <button
                                key={item.id}
                                type="button"
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    onToggle(item.id);
                                    setQuery('');
                                }}
                                className="w-full text-left px-3 py-2 text-sm text-primary-900 dark:text-primary-100 hover:bg-primary-50 dark:hover:bg-primary-800 transition-colors"
                            >
                                {item.name}
                            </button>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

// ---------------------------------------------------------------------------
// SceneDetail
// ---------------------------------------------------------------------------

export const SceneDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { scenes, addScene, deleteScene, locations, characters, people, assets } = useStore();
    const { activeProjectId } = useProjects();
    const { confirm, confirmDialog } = useConfirmDialog();

    const scene = scenes.find((s) => s.id === id);

    const [state, dispatch] = useReducer(sceneReducer, initialState);
    const { name, number, description, comment, locationId, length, characters: selectedChars, peopleIds, assetIds, isDirty, saveStatus } = state;

    const [open, setOpen] = useState({ description: true, admin: true });
    const toggle = (key: keyof typeof open) => setOpen(prev => ({ ...prev, [key]: !prev[key] }));

    const syncedId = useRef('');
    useEffect(() => {
        if (id === syncedId.current || !scene) return;
        syncedId.current = id ?? '';
        dispatch({
            type: 'SYNC',
            payload: {
                name: scene.name,
                number: scene.number,
                description: scene.description,
                comment: scene.comment ?? '',
                locationId: scene.locationId,
                length: scene.length?.toString() ?? '',
                characters: scene.characters ?? [],
                peopleIds: scene.peopleIds ?? [],
                assetIds: scene.assetIds ?? [],
            },
        });
    }, [id, scene]);

    if (!scene) {
        return <div className="p-8">Scene not found</div>;
    }

    const handleSave = async () => {
        dispatch({ type: 'SET_STATUS', status: 'saving' });
        try {
            const updated: Scene = {
                ...scene,
                name, number, description, comment,
                locationId,
                length: length ? Number(length) : undefined,
                characters: selectedChars,
                peopleIds,
                assetIds,
            };
            await addScene(updated);
            dispatch({ type: 'SAVED' });
        } catch (err) {
            console.error('Save failed', err);
            dispatch({ type: 'SET_STATUS', status: 'error' });
        }
    };

    const handleDelete = async () => {
        if (await confirm('Are you sure you want to delete this scene?', { title: 'Delete Scene', confirmLabel: 'Delete' })) {
            await deleteScene(scene.id);
            navigate('..');
        }
    };

    const inputClass = "bg-white dark:bg-primary-900 border border-primary-200 dark:border-primary-700 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder-primary-300 dark:placeholder-primary-700 transition-colors hover:border-primary-300 dark:hover:border-primary-600 shadow-sm text-primary-900 dark:text-white";

    return (
        <div className="flex flex-col gap-8 w-full max-w-5xl mx-auto">
            {/* Header row */}
            <div className="flex items-center justify-between gap-4">
                <Link
                    to=".."
                    className="inline-flex items-center gap-2 h-8 px-3 -ml-3 text-sm font-semibold rounded-lg transition-colors text-primary-500 hover:text-primary-900 hover:bg-primary-50 dark:text-primary-400 dark:hover:text-primary-100 dark:hover:bg-primary-900/60"
                >
                    <ArrowLeft size={16} /> Back to Scenes
                </Link>
                <div className="flex gap-2 items-center">
                    {saveStatus === 'saving' && (
                        <span className="text-primary-500 text-sm flex items-center gap-1">
                            <Loader2 className="animate-spin" size={14} /> Saving...
                        </span>
                    )}
                    {saveStatus === 'saved' && (
                        <span className="text-green-600 dark:text-green-400 text-sm font-semibold">Saved</span>
                    )}
                    {saveStatus === 'error' && (
                        <span className="text-danger-600 text-sm font-semibold">Error saving</span>
                    )}
                    <Link to={`/project/${activeProjectId}/scenes/${id}/shots`}>
                        <Button size="sm" variant="outline">
                            <Clapperboard size={16} /> Shots
                        </Button>
                    </Link>
                    <div className="w-px h-6 bg-primary-200 dark:bg-primary-800 mx-1" />
                    <Button onClick={handleSave} disabled={!isDirty || saveStatus === 'saving'} size="sm">
                        <Save size={16} /> Save
                    </Button>
                    <div className="w-px h-6 bg-primary-200 dark:bg-primary-800 mx-1" />
                    <Button variant="danger" onClick={handleDelete} size="sm">
                        <Trash2 size={16} /> Delete
                    </Button>
                </div>
            </div>

            {/* Number + Name */}
            <div className="flex gap-3">
                <input
                    type="text"
                    value={number}
                    onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'number', value: e.target.value })}
                    className="text-4xl font-bold text-primary-900 dark:text-white bg-white dark:bg-primary-900 border border-primary-200 dark:border-primary-700 rounded-lg px-4 py-2 w-24 focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder-primary-300 dark:placeholder-primary-700 transition-colors hover:border-primary-300 dark:hover:border-primary-600 shadow-sm text-center"
                    placeholder="#"
                />
                <input
                    type="text"
                    value={name}
                    onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'name', value: e.target.value })}
                    className="text-4xl font-bold text-primary-900 dark:text-white bg-white dark:bg-primary-900 border border-primary-200 dark:border-primary-700 rounded-lg px-4 py-2 flex-1 focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder-primary-300 dark:placeholder-primary-700 transition-colors hover:border-primary-300 dark:hover:border-primary-600 shadow-sm"
                    placeholder="Scene Name"
                />
            </div>

            {/* ── Description ── */}
            <div className="flex flex-col gap-6">
                <SectionHeader title="Description" isOpen={open.description} onToggle={() => toggle('description')} />
                {open.description && (
                    <div className="grid md:grid-cols-2 gap-6">
                        <section className="flex flex-col gap-2">
                            <h3 className="font-semibold text-primary-900 dark:text-white">Description</h3>
                            <textarea
                                value={description}
                                onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'description', value: e.target.value })}
                                className={`${inputClass} min-h-[120px] resize-y`}
                                placeholder="Describe the scene..."
                            />
                        </section>

                        <div className="flex flex-col gap-6">
                            <section className="flex flex-col gap-2">
                                <h3 className="font-semibold text-primary-900 dark:text-white flex items-center gap-1.5">
                                    Length
                                    <Tooltip label="Enter estimated length of scene (in sec)">
                                        <Info size={13} className="text-primary-400 cursor-default" />
                                    </Tooltip>
                                </h3>
                                <input
                                    type="number"
                                    value={length}
                                    onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'length', value: e.target.value })}
                                    className={inputClass}
                                    placeholder="20 sec"
                                    min={0}
                                />
                            </section>

                            <section className="flex flex-col gap-2">
                                <h3 className="font-semibold text-primary-900 dark:text-white flex items-center gap-1.5">
                                    <MapPin size={14} className="text-primary-400" /> Location
                                </h3>
                                <select
                                    value={locationId}
                                    onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'locationId', value: e.target.value })}
                                    className={inputClass}
                                >
                                    <option value="">— No location —</option>
                                    {locations.map(loc => (
                                        <option key={loc.id} value={loc.id}>{loc.name}</option>
                                    ))}
                                </select>
                            </section>

                            <section className="flex flex-col gap-2">
                                <h3 className="font-semibold text-primary-900 dark:text-white">Characters</h3>
                                <MultiSelect
                                    allItems={characters.map(c => ({ id: c.id, name: c.name }))}
                                    selectedIds={selectedChars}
                                    onToggle={(id) => dispatch({ type: 'TOGGLE_ID', field: 'characters', id })}
                                    placeholder="Search characters…"
                                    emptyMessage="No characters in this project yet."
                                />
                            </section>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Admin ── */}
            <div className="flex flex-col gap-6">
                <SectionHeader title="Admin" isOpen={open.admin} onToggle={() => toggle('admin')} />
                {open.admin && (
                    <div className="grid md:grid-cols-2 gap-6">
                        <section className="flex flex-col gap-2">
                            <h3 className="font-semibold text-primary-900 dark:text-white">Notes</h3>
                            <textarea
                                value={comment}
                                onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'comment', value: e.target.value })}
                                className={`${inputClass} min-h-[120px] resize-y`}
                                placeholder="Internal notes..."
                            />
                        </section>

                        <div className="flex flex-col gap-6">
                            <section className="flex flex-col gap-2">
                                <h3 className="font-semibold text-primary-900 dark:text-white">People</h3>
                                <MultiSelect
                                    allItems={people.map(p => ({ id: p.id, name: p.name }))}
                                    selectedIds={peopleIds}
                                    onToggle={(id) => dispatch({ type: 'TOGGLE_ID', field: 'peopleIds', id })}
                                    placeholder="Search people…"
                                    emptyMessage="No people in this project yet."
                                />
                            </section>
                            <section className="flex flex-col gap-2">
                                <h3 className="font-semibold text-primary-900 dark:text-white">Assets</h3>
                                <MultiSelect
                                    allItems={assets.map(a => ({ id: a.id, name: a.name }))}
                                    selectedIds={assetIds}
                                    onToggle={(id) => dispatch({ type: 'TOGGLE_ID', field: 'assetIds', id })}
                                    placeholder="Search assets…"
                                    emptyMessage="No assets in this project yet."
                                />
                            </section>
                        </div>
                    </div>
                )}
            </div>
            {confirmDialog}
        </div>
    );
};
