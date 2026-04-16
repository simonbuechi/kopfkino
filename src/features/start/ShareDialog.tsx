import React, { useState, useEffect } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { X, UserPlus, Crown, Pencil, Eye, Trash2, ArrowRightLeft, Clock } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useProjects } from '../../hooks/useProjects';
import { storage } from '../../services/storage';
import type { Project, ProjectRole, ProjectMember, Invitation } from '../../types/types';

interface Props {
    project: Project;
    onClose: () => void;
}

const ROLE_LABELS: Record<ProjectRole, string> = {
    owner: 'Owner',
    editor: 'Editor',
    viewer: 'Viewer',
};

const RoleIcon = ({ role }: { role: ProjectRole }) => {
    if (role === 'owner') return <Crown size={14} className="text-amber-500" />;
    if (role === 'editor') return <Pencil size={14} className="text-blue-500" />;
    return <Eye size={14} className="text-zinc-400" />;
};

export const ShareDialog: React.FC<Props> = ({ project, onClose }) => {
    const { user } = useAuth();
    const { shareProject, removeMember, updateMemberRole, transferOwnership } = useProjects();

    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState<'editor' | 'viewer'>('editor');
    const [inviting, setInviting] = useState(false);
    const [inviteSuccess, setInviteSuccess] = useState(false);
    const [inviteError, setInviteError] = useState('');

    const [pendingInvitations, setPendingInvitations] = useState<Invitation[]>([]);

    const [updatingRole, setUpdatingRole] = useState<string | null>(null);

    const [transferTargetId, setTransferTargetId] = useState('');
    const [transferring, setTransferring] = useState(false);

    const isOwner = user && project.ownerId === user.uid;
    const members = Object.entries(project.members ?? {}) as [string, ProjectMember][];
    // Sort: owner first, then editors, then viewers
    members.sort(([, a], [, b]) => {
        const order = { owner: 0, editor: 1, viewer: 2 };
        return order[a.role] - order[b.role];
    });
    const editors = members.filter(([, m]) => m.role === 'editor');

    // Subscribe to pending invitations for this project
    useEffect(() => {
        if (!isOwner) return;
        const unsubscribers: (() => void)[] = [];
        // Collect invitations by fetching once — no real-time needed here
        storage.getPendingInvitationsForProject(project.id).then(setPendingInvitations);
        return () => unsubscribers.forEach(u => u());
    }, [isOwner, project.id]);

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteEmail.trim()) return;
        setInviting(true);
        setInviteError('');
        setInviteSuccess(false);
        try {
            await shareProject(project.id, inviteEmail.trim(), inviteRole);
            setInviteSuccess(true);
            setInviteEmail('');
            // Refresh pending list
            const updated = await storage.getPendingInvitationsForProject(project.id);
            setPendingInvitations(updated);
        } catch {
            setInviteError('Failed to send invitation. Please try again.');
        } finally {
            setInviting(false);
        }
    };

    const handleRemove = async (targetUserId: string, displayName: string) => {
        if (!window.confirm(`Remove ${displayName} from this project?`)) return;
        await removeMember(project.id, targetUserId);
    };

    const handleRoleChange = async (targetUserId: string, newRole: 'editor' | 'viewer') => {
        setUpdatingRole(targetUserId);
        try {
            await updateMemberRole(project.id, targetUserId, newRole);
        } finally {
            setUpdatingRole(null);
        }
    };

    const handleRevokeInvitation = async (invitationId: string) => {
        await storage.revokeInvitation(invitationId);
        setPendingInvitations(prev => prev.filter(i => i.id !== invitationId));
    };

    const handleTransfer = async () => {
        if (!transferTargetId) return;
        const target = project.members[transferTargetId];
        if (!window.confirm(`Transfer ownership to ${target?.displayName ?? target?.email}? You will become an Editor.`)) return;
        setTransferring(true);
        try {
            await transferOwnership(project.id, transferTargetId);
            onClose();
        } catch {
            // keep dialog open on error
        } finally {
            setTransferring(false);
        }
    };

    return (
        <Dialog open onClose={onClose} className="relative z-50">
            <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
            <div className="fixed inset-0 flex items-center justify-center p-4">
                <DialogPanel className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
                        <DialogTitle className="font-semibold text-zinc-900 dark:text-zinc-100">
                            Manage members &mdash; {project.name}
                        </DialogTitle>
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <div className="px-6 py-4 space-y-6 max-h-[70vh] overflow-y-auto">

                        {/* Members list */}
                        <section>
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">
                                Members ({members.length})
                            </h3>
                            <ul className="space-y-1">
                                {members.map(([uid, member]) => {
                                    const isMe = uid === user?.uid;
                                    const isThisOwner = member.role === 'owner';
                                    return (
                                        <li key={uid} className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                                            {/* Avatar placeholder */}
                                            <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center shrink-0 text-xs font-semibold text-zinc-600 dark:text-zinc-300 uppercase">
                                                {(member.displayName || member.email || '?')[0]}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                                                    {member.displayName || member.email}
                                                    {isMe && <span className="ml-1.5 text-xs font-normal text-zinc-400">(you)</span>}
                                                </p>
                                                <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{member.email}</p>
                                            </div>

                                            {/* Role — dropdown for non-owner members if current user is owner */}
                                            {isOwner && !isMe && !isThisOwner ? (
                                                <select
                                                    value={member.role}
                                                    disabled={updatingRole === uid}
                                                    onChange={e => handleRoleChange(uid, e.target.value as 'editor' | 'viewer')}
                                                    className="text-xs rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-zinc-950/10 dark:focus:ring-white/10 disabled:opacity-50 shrink-0"
                                                >
                                                    <option value="editor">Editor</option>
                                                    <option value="viewer">Viewer</option>
                                                </select>
                                            ) : (
                                                <span className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400 shrink-0">
                                                    <RoleIcon role={member.role} />
                                                    {ROLE_LABELS[member.role]}
                                                </span>
                                            )}

                                            {isOwner && !isMe && (
                                                <button
                                                    onClick={() => handleRemove(uid, member.displayName || member.email)}
                                                    className="p-1.5 rounded-md text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors shrink-0"
                                                    title="Remove member"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                        </section>

                        {/* Pending invitations */}
                        {isOwner && pendingInvitations.length > 0 && (
                            <section>
                                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">
                                    Pending invitations
                                </h3>
                                <ul className="space-y-1">
                                    {pendingInvitations.map(inv => (
                                        <li key={inv.id} className="flex items-center gap-3 py-2 px-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
                                            <Clock size={14} className="text-zinc-400 shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-zinc-700 dark:text-zinc-300 truncate">{inv.email}</p>
                                                <p className="text-xs text-zinc-400">{ROLE_LABELS[inv.role]} · awaiting sign-in</p>
                                            </div>
                                            <button
                                                onClick={() => handleRevokeInvitation(inv.id)}
                                                className="p-1.5 rounded-md text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors shrink-0"
                                                title="Revoke invitation"
                                            >
                                                <X size={14} />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        )}

                        {/* Invite section */}
                        {isOwner && (
                            <section>
                                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">
                                    Invite by email
                                </h3>
                                <form onSubmit={handleInvite} className="flex gap-2">
                                    <input
                                        type="email"
                                        placeholder="name@example.com"
                                        value={inviteEmail}
                                        onChange={e => setInviteEmail(e.target.value)}
                                        className="flex-1 px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-950/10 dark:focus:ring-white/10"
                                        required
                                    />
                                    <select
                                        value={inviteRole}
                                        onChange={e => setInviteRole(e.target.value as 'editor' | 'viewer')}
                                        className="px-2 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-950/10 dark:focus:ring-white/10"
                                    >
                                        <option value="editor">Editor</option>
                                        <option value="viewer">Viewer</option>
                                    </select>
                                    <button
                                        type="submit"
                                        disabled={inviting || !inviteEmail.trim()}
                                        className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg bg-zinc-200 dark:bg-zinc-100 text-zinc-900 hover:bg-zinc-300 dark:hover:bg-zinc-200 disabled:opacity-50 transition-colors shrink-0"
                                    >
                                        <UserPlus size={14} />
                                        {inviting ? 'Sending…' : 'Invite'}
                                    </button>
                                </form>
                                {inviteSuccess && (
                                    <p className="mt-2 text-xs text-green-600 dark:text-green-400">
                                        Invitation sent. They&rsquo;ll get access when they sign in with that email.
                                    </p>
                                )}
                                {inviteError && (
                                    <p className="mt-2 text-xs text-red-500">{inviteError}</p>
                                )}
                            </section>
                        )}

                        {/* Transfer ownership */}
                        {isOwner && editors.length > 0 && (
                            <section>
                                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">
                                    Transfer ownership
                                </h3>
                                <div className="flex gap-2">
                                    <select
                                        value={transferTargetId}
                                        onChange={e => setTransferTargetId(e.target.value)}
                                        className="flex-1 px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-950/10 dark:focus:ring-white/10"
                                    >
                                        <option value="">Select an editor…</option>
                                        {editors.map(([uid, member]) => (
                                            <option key={uid} value={uid}>
                                                {member.displayName} ({member.email})
                                            </option>
                                        ))}
                                    </select>
                                    <button
                                        onClick={handleTransfer}
                                        disabled={!transferTargetId || transferring}
                                        className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30 border border-red-200 dark:border-red-800 disabled:opacity-50 transition-colors shrink-0"
                                    >
                                        <ArrowRightLeft size={14} />
                                        {transferring ? 'Transferring…' : 'Transfer'}
                                    </button>
                                </div>
                                <p className="mt-1.5 text-xs text-zinc-400">
                                    You will become an Editor after transferring.
                                </p>
                            </section>
                        )}
                    </div>
                </DialogPanel>
            </div>
        </Dialog>
    );
};
