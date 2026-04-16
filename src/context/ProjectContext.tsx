import React, { useReducer, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { storage } from '../services/storage';
import type { Project, ProjectRole, Invitation } from '../types/types';
import { ProjectContext } from './ProjectContextObject';

type ProjectState = {
    projects: Project[];
    activeProjectId: string | null;
    loading: boolean;
};

type ProjectAction =
    | { type: 'SET_DATA'; payload: Partial<ProjectState> }
    | { type: 'RESET' };

const projectReducer = (state: ProjectState, action: ProjectAction): ProjectState => {
    switch (action.type) {
        case 'SET_DATA':
            return { ...state, ...action.payload };
        case 'RESET':
            return { projects: [], activeProjectId: null, loading: false };
        default:
            return state;
    }
};

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();

    const [state, dispatch] = useReducer(projectReducer, {
        projects: [],
        activeProjectId: localStorage.getItem('activeProjectId'),
        loading: true,
    });

    const { projects, activeProjectId, loading } = state;

    const activeProjectIdRef = useRef(activeProjectId);

    const activeProject = projects.find(p => p.id === activeProjectId) || null;

    const activeProjectRole: ProjectRole | null =
        activeProject && user ? (activeProject.members?.[user.uid]?.role ?? null) : null;

    // Keep localStorage in sync with activeProjectId
    useEffect(() => {
        activeProjectIdRef.current = activeProjectId;
        if (activeProjectId) {
            localStorage.setItem('activeProjectId', activeProjectId);
        } else {
            localStorage.removeItem('activeProjectId');
        }
    }, [activeProjectId]);

    useEffect(() => {
        if (!user) {
            dispatch({ type: 'RESET' });
            return;
        }

        let cancelled = false;
        let projectsUnsub: (() => void) | null = null;
        let invitationsUnsub: (() => void) | null = null;

        // Auto-accept any pending invitations for this user's email
        if (user.email) {
            invitationsUnsub = storage.subscribeToInvitations(user.email, async (invitations: Invitation[]) => {
                for (const inv of invitations) {
                    try {
                        await storage.acceptInvitation(inv, user);
                    } catch (e) {
                        console.error('Failed to accept invitation', e);
                    }
                }
            });
        }

        // Subscribe to all accessible projects
        projectsUnsub = storage.subscribeToProjects(user.uid, async (fetchedProjects) => {
            if (cancelled) return;
            const currentActiveId = activeProjectIdRef.current;
            let nextActiveId = currentActiveId;

            if (fetchedProjects.length === 0) {
                // Create a default project for brand-new users
                const defaultProject: Project = {
                    id: crypto.randomUUID(),
                    name: 'Default Project',
                    description: 'Your first project',
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                    ownerId: user.uid,
                    members: {
                        [user.uid]: {
                            role: 'owner',
                            email: user.email ?? '',
                            displayName: user.displayName ?? user.email ?? 'Unknown',
                            addedAt: Date.now(),
                        },
                    },
                };
                await storage.saveProject(user.uid, defaultProject);
                nextActiveId = defaultProject.id;
            } else {
                const isValid = currentActiveId && fetchedProjects.find(p => p.id === currentActiveId);
                if (!isValid) {
                    nextActiveId = fetchedProjects.length === 1 ? fetchedProjects[0].id : null;
                }
            }

            dispatch({
                type: 'SET_DATA',
                payload: { projects: fetchedProjects, activeProjectId: nextActiveId, loading: false },
            });
        });

        return () => {
            cancelled = true;
            projectsUnsub?.();
            invitationsUnsub?.();
        };
    }, [user]);

    const createProject = async (name: string, description: string, url?: string) => {
        if (!user) return;
        const newProject: Project = {
            id: crypto.randomUUID(),
            name,
            description,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            url,
            ownerId: user.uid,
            members: {
                [user.uid]: {
                    role: 'owner',
                    email: user.email ?? '',
                    displayName: user.displayName ?? user.email ?? 'Unknown',
                    addedAt: Date.now(),
                },
            },
        };
        await storage.saveProject(user.uid, newProject);
        dispatch({ type: 'SET_DATA', payload: { activeProjectId: newProject.id } });
    };

    const selectProject = (projectId: string | null) => {
        dispatch({ type: 'SET_DATA', payload: { activeProjectId: projectId } });
    };

    const deleteProject = async (projectId: string) => {
        if (!user) return;
        await storage.deleteProject(user.uid, projectId);
    };

    const shareProject = async (projectId: string, inviteeEmail: string, role: ProjectRole) => {
        if (!user) return;
        await storage.inviteToProject(projectId, user.uid, inviteeEmail, role);
    };

    const removeMember = async (projectId: string, targetUserId: string) => {
        if (!user) return;
        await storage.removeMember(projectId, targetUserId);
    };

    const updateMemberRole = async (projectId: string, targetUserId: string, role: ProjectRole) => {
        if (!user) return;
        await storage.updateMemberRole(projectId, targetUserId, role);
    };

    const transferOwnership = async (projectId: string, newOwnerId: string) => {
        if (!user) return;
        await storage.transferOwnership(projectId, user.uid, newOwnerId);
    };

    return (
        <ProjectContext.Provider value={{
            projects,
            activeProject,
            activeProjectId,
            activeProjectRole,
            createProject,
            selectProject,
            deleteProject,
            shareProject,
            removeMember,
            updateMemberRole,
            transferOwnership,
            loading,
        }}>
            {children}
        </ProjectContext.Provider>
    );
};
