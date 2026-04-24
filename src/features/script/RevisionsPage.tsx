import React, { useState } from 'react';
import { useStore } from '../../hooks/useStore';
import { useProjects } from '../../hooks/useProjects';
import { Button } from '../../components/ui/Button';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { Plus, Trash2, X, Clock, ChevronLeft } from 'lucide-react';
import type { ScriptRevision } from '../../types/types';

function formatDate(ts: number): string {
    return new Date(ts).toLocaleString(undefined, {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

export const RevisionsPage: React.FC = () => {
    const { script, scriptRevisions, saveScriptRevision, deleteScriptRevision } = useStore();
    const { activeProjectId } = useProjects();

    const [createOpen, setCreateOpen] = useState(false);
    const [name, setName] = useState('');
    const [saving, setSaving] = useState(false);

    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    const [viewing, setViewing] = useState<ScriptRevision | null>(null);

    const handleCreate = async () => {
        if (!name.trim() || !activeProjectId || !script) return;
        setSaving(true);
        const revision: ScriptRevision = {
            id: crypto.randomUUID(),
            projectId: activeProjectId,
            name: name.trim(),
            content: script.content,
            createdAt: Date.now(),
        };
        await saveScriptRevision(revision);
        setSaving(false);
        setName('');
        setCreateOpen(false);
    };

    const handleDelete = async () => {
        if (!confirmDeleteId) return;
        setDeleting(true);
        await deleteScriptRevision(confirmDeleteId);
        setDeleting(false);
        setConfirmDeleteId(null);
    };

    if (viewing) {
        return (
            <div className="w-full">
                <div className="flex items-center gap-3 mb-6">
                    <button
                        onClick={() => setViewing(null)}
                        className="flex items-center gap-1.5 text-sm font-semibold text-primary-500 dark:text-primary-400 hover:text-primary-900 dark:hover:text-primary-100 transition-colors"
                    >
                        <ChevronLeft size={16} /> Back to revisions
                    </button>
                    <span className="text-primary-300 dark:text-primary-700">|</span>
                    <span className="text-sm font-bold text-primary-900 dark:text-white">{viewing.name}</span>
                    <span className="text-xs text-primary-400 ml-auto">{formatDate(viewing.createdAt)}</span>
                </div>
                <div className="font-mono text-sm leading-6">
                    <div className="mx-auto py-6" style={{ width: '60ch' }}>
                        <pre className="whitespace-pre-wrap text-primary-900 dark:text-primary-100">{viewing.content}</pre>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold text-primary-900 dark:text-white">Revisions</h2>
                <Button
                    size="sm"
                    onClick={() => setCreateOpen(true)}
                    disabled={!script?.content?.trim()}
                >
                    <Plus size={14} /> Create revision
                </Button>
            </div>

            {scriptRevisions.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[30vh] text-primary-400 dark:text-primary-600 gap-3">
                    <Clock size={40} className="opacity-30" />
                    <p className="text-sm font-semibold">No revisions yet</p>
                    <p className="text-xs opacity-70">Save a snapshot of your current script to track changes over time.</p>
                </div>
            ) : (
                <ul className="space-y-2">
                    {scriptRevisions.map(rev => (
                        <li
                            key={rev.id}
                            className="flex items-center gap-4 px-4 py-3 rounded-xl border border-primary-200 dark:border-primary-800 bg-white dark:bg-primary-900 hover:border-primary-300 dark:hover:border-primary-700 transition-colors group cursor-pointer"
                            onClick={() => setViewing(rev)}
                        >
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-primary-900 dark:text-white truncate">{rev.name}</p>
                                <p className="text-xs text-primary-400 dark:text-primary-500 mt-0.5">{formatDate(rev.createdAt)}</p>
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(rev.id); }}
                                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-primary-400 hover:text-danger-600 dark:hover:text-danger-400 hover:bg-primary-100 dark:hover:bg-primary-800 transition-all"
                                title="Delete revision"
                            >
                                <Trash2 size={15} />
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            {/* Create revision modal */}
            <Dialog open={createOpen} onClose={() => setCreateOpen(false)} className="relative z-50">
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <DialogPanel className="w-full max-w-sm rounded-2xl bg-white dark:bg-primary-900 border border-primary-200 dark:border-primary-800 p-6 shadow-xl">
                        <div className="flex items-center justify-between mb-4">
                            <DialogTitle className="text-lg font-semibold text-primary-900 dark:text-white">
                                Create revision
                            </DialogTitle>
                            <Button variant="ghost" size="icon" onClick={() => setCreateOpen(false)}>
                                <X size={16} />
                            </Button>
                        </div>
                        <input
                            autoFocus
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleCreate()}
                            placeholder="e.g. Draft 2, Before rewrites…"
                            className="w-full px-3 py-2 rounded-lg border border-primary-200 dark:border-primary-700 bg-white dark:bg-primary-800 text-sm text-primary-900 dark:text-white placeholder:text-primary-400 focus:outline-none focus:ring-2 focus:ring-secondary-400 mb-5"
                        />
                        <div className="flex justify-end gap-3">
                            <Button variant="secondary" size="sm" onClick={() => setCreateOpen(false)}>
                                Cancel
                            </Button>
                            <Button size="sm" onClick={handleCreate} disabled={!name.trim() || saving}>
                                {saving ? 'Saving…' : 'Save revision'}
                            </Button>
                        </div>
                    </DialogPanel>
                </div>
            </Dialog>

            {/* Delete confirmation modal */}
            <Dialog open={!!confirmDeleteId} onClose={() => setConfirmDeleteId(null)} className="relative z-50">
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <DialogPanel className="w-full max-w-sm rounded-2xl bg-white dark:bg-primary-900 border border-primary-200 dark:border-primary-800 p-6 shadow-xl">
                        <div className="flex items-center gap-3 mb-3">
                            <Trash2 size={20} className="text-danger-500 shrink-0" />
                            <DialogTitle className="text-lg font-semibold text-primary-900 dark:text-white">
                                Delete revision?
                            </DialogTitle>
                        </div>
                        <p className="text-sm text-primary-500 dark:text-primary-400 mb-6">
                            This revision will be permanently deleted and cannot be recovered.
                        </p>
                        <div className="flex justify-end gap-3">
                            <Button variant="secondary" size="sm" onClick={() => setConfirmDeleteId(null)}>
                                Cancel
                            </Button>
                            <Button variant="danger" size="sm" onClick={handleDelete} disabled={deleting}>
                                {deleting ? 'Deleting…' : 'Delete'}
                            </Button>
                        </div>
                    </DialogPanel>
                </div>
            </Dialog>
        </div>
    );
};
