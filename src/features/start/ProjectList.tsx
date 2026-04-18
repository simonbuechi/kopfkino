import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjects } from '../../hooks/useProjects';
import { useAuth } from '../../hooks/useAuth';
import { useStore } from '../../hooks/useStore';
import { storage } from '../../services/storage';
import { Plus, Trash2, Edit2, Play, MapPin, Users, Clapperboard, Film, Clock, Video, ExternalLink, Share2, Crown, Eye } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { ShareDialog } from './ShareDialog';
import type { Project } from '../../types/types';
import { formatTimeCode } from '../../utils/time';

export const ProjectList: React.FC = () => {
    const { projects, createProject, deleteProject, activeProjectId } = useProjects();
    const { user } = useAuth();
    const { locations, scenes, characters } = useStore();
    const navigate = useNavigate();
    const [isCreating, setIsCreating] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [sharingProject, setSharingProject] = useState<Project | null>(null);
    const [name, setName] = useState('');
    const [desc, setDesc] = useState('');
    const [url, setUrl] = useState('');

    const [otherStats, setOtherStats] = useState<Record<string, { locations: number; scenes: number; shots: number; characters: number; length: number }>>({});

    // Fetch stats for non-active projects once per user session
    useEffect(() => {
        if (!user) return;
        storage.getAllProjectStats(user.uid).then(setOtherStats);
    }, [user]);

    // Compute active project stats from already-loaded in-memory data
    const activeStats = useMemo(() => {
        if (!activeProjectId) return null;
        const shots = scenes.reduce((n, s) => n + (s.shots?.length ?? 0), 0);
        const length = scenes.reduce((total, s) => total + (s.shots?.reduce((acc, shot) => acc + (shot.length || 0), 0) ?? 0), 0);
        return { locations: locations.length, scenes: scenes.length, shots, characters: characters.length, length };
    }, [activeProjectId, locations, scenes, characters]);

    const stats = useMemo(() => {
        if (!activeProjectId || !activeStats) return otherStats;
        return { ...otherStats, [activeProjectId]: activeStats };
    }, [otherStats, activeProjectId, activeStats]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        await createProject(name, desc, url);
        setIsCreating(false);
        setName('');
        setDesc('');
        setUrl('');
    };

    const startEditing = (project: Project) => {
        setEditingId(project.id);
        setName(project.name);
        setDesc(project.description);
        setUrl(project.url || '');
        setIsCreating(false);
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !user || !editingId) return;
        const project = projects.find(p => p.id === editingId);
        if (project) {
            const updated = { ...project, name, description: desc, url, updatedAt: Date.now() };
            await storage.saveProject(user.uid, updated);
        }
        setEditingId(null);
        setName('');
        setDesc('');
        setUrl('');
    };

    const handleDelete = async (e: React.MouseEvent, projectId: string) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this project?')) {
            await deleteProject(projectId);
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-6">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-primary-900 dark:text-white">Projects</h2>
                    <p className="text-primary-500 dark:text-primary-400 mt-1">Manage your film projects</p>
                </div>
                {!isCreating && !editingId && (
                    <Button
                        onClick={() => setIsCreating(true)}
                        className="flex items-center gap-2"
                    >
                        <Plus size={20} />
                        New Project
                    </Button>
                )}
            </div>

            {(isCreating || editingId) && (
                <div className="mb-8 p-6 bg-white dark:bg-primary-800 rounded-lg shadow-lg border border-primary-200 dark:border-primary-700">
                    <h3 className="text-xl font-semibold mb-4 text-primary-900 dark:text-white">
                        {editingId ? 'Edit Project' : 'Create New Project'}
                    </h3>
                    <form onSubmit={editingId ? handleUpdate : handleCreate} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-primary-700 dark:text-primary-300 mb-1">
                                Project Name
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-3 py-2 bg-primary-50 dark:bg-primary-900 border border-primary-300 dark:border-primary-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-900 dark:focus:ring-white text-primary-900 dark:text-white"
                                placeholder="My New Film"
                                autoFocus
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-primary-700 dark:text-primary-300 mb-1">
                                Description
                            </label>
                            <textarea
                                value={desc}
                                onChange={(e) => setDesc(e.target.value)}
                                className="w-full px-3 py-2 bg-primary-50 dark:bg-primary-900 border border-primary-300 dark:border-primary-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-900 dark:focus:ring-white text-primary-900 dark:text-white"
                                placeholder="A short description..."
                                rows={3}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-primary-700 dark:text-primary-300 mb-1">
                                Project URL
                            </label>
                            <input
                                type="url"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                className="w-full px-3 py-2 bg-primary-50 dark:bg-primary-900 border border-primary-300 dark:border-primary-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-900 dark:focus:ring-white text-primary-900 dark:text-white"
                                placeholder="https://example.com"
                            />
                        </div>
                        <div className="flex justify-end gap-3">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => { setIsCreating(false); setEditingId(null); setName(''); setDesc(''); setUrl(''); }}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={!name.trim()}
                            >
                                {editingId ? 'Save Changes' : 'Create Project'}
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => {
                    const projectStats = stats[project.id] || { locations: 0, scenes: 0, shots: 0, characters: 0, length: 0 };
                    const isOwner = user && project.ownerId === user.uid;
                    const myRole = user ? project.members?.[user.uid]?.role : null;
                    const isShared = !isOwner;
                    const memberCount = Object.keys(project.members ?? {}).length;

                    return (
                        <div
                            key={project.id}
                            className="group flex flex-col bg-white dark:bg-primary-800 rounded-xl shadow-sm hover:shadow-md border border-primary-200 dark:border-primary-700 transition-all overflow-hidden"
                        >
                            <div className="p-6 flex-1">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="relative p-3 rounded-lg bg-primary-100 dark:bg-primary-800 text-primary-900 dark:text-primary-100">
                                        <Clapperboard size={24} />
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {/* Share button — always visible for owner */}
                                        {isOwner && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setSharingProject(project); }}
                                                className="p-2 text-primary-400 hover:text-primary-900 dark:hover:text-primary-100 hover:bg-primary-100 dark:hover:bg-primary-700 rounded-md transition-colors"
                                                title="Share Project"
                                            >
                                                <Share2 size={18} />
                                            </button>
                                        )}
                                        {/* Edit & Delete only for owners */}
                                        {isOwner && (
                                            <>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); startEditing(project); }}
                                                    className="p-2 text-primary-400 hover:text-primary-900 dark:hover:text-primary-100 hover:bg-primary-100 dark:hover:bg-primary-700 rounded-md transition-colors"
                                                    title="Edit Project"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={(e) => handleDelete(e, project.id)}
                                                    className="p-2 text-primary-400 hover:text-danger-500 hover:bg-danger-500/10 rounded-md transition-colors"
                                                    title="Delete Project"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <h3 className="text-xl font-bold text-primary-900 dark:text-white truncate">
                                        {project.name}
                                    </h3>
                                    {/* Role badges */}
                                    {isShared && myRole === 'viewer' && (
                                        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 shrink-0">
                                            <Eye size={11} /> View only
                                        </span>
                                    )}
                                    {isShared && myRole === 'editor' && (
                                        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 shrink-0">
                                            Shared
                                        </span>
                                    )}
                                    {isOwner && memberCount > 1 && (
                                        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 shrink-0">
                                            <Crown size={11} /> {memberCount} members
                                        </span>
                                    )}
                                </div>

                                <p className="text-primary-500 dark:text-primary-400 text-sm line-clamp-2 h-10 mb-3">
                                    {project.description || 'No description'}
                                </p>

                                <div className="h-8 mb-6">
                                    {project.url && (
                                        <a
                                            href={project.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={(e) => e.stopPropagation()}
                                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-primary-100 dark:bg-primary-800 text-primary-600 dark:text-primary-400 hover:text-primary-900 dark:hover:text-primary-200 hover:bg-primary-200 dark:hover:bg-primary-700 transition-colors border border-primary-200 dark:border-primary-700 max-w-full truncate"
                                        >
                                            <ExternalLink size={12} className="shrink-0" />
                                            <span className="truncate">{project.url.replace(/^https?:\/\//, '')}</span>
                                        </a>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400">
                                        <MapPin size={16} />
                                        <span>{projectStats.locations} Locations</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400">
                                        <Users size={16} />
                                        <span>{projectStats.characters} Characters</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400">
                                        <Film size={16} />
                                        <span>{projectStats.scenes} Scenes</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400">
                                        <Video size={16} />
                                        <span>{projectStats.shots} Shots</span>
                                    </div>
                                    <div className="col-span-2 flex items-center gap-2 text-primary-600 dark:text-primary-400">
                                        <Clock size={16} />
                                        <span>Total Length: {formatTimeCode(projectStats.length)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 bg-primary-50 dark:bg-primary-900/50 border-t border-primary-200 dark:border-primary-700 flex justify-end">
                                <Button
                                    onClick={() => navigate(`/project/${project.id}`)}
                                    className="flex items-center gap-2"
                                >
                                    <Play size={16} className="fill-current" />
                                    Open Project
                                </Button>
                            </div>
                        </div>
                    );
                })}

                {projects.length === 0 && !isCreating && (
                    <div className="col-span-full text-center py-12 text-primary-500">
                        No projects found. Create one to get started.
                    </div>
                )}
            </div>

            {sharingProject && (
                <ShareDialog
                    project={sharingProject}
                    onClose={() => setSharingProject(null)}
                />
            )}
        </div>
    );
};
