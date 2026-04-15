import React, { useReducer, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { storage } from '../services/storage';
import type { Project } from '../types/types';
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
            return {
                projects: [],
                activeProjectId: null,
                loading: false
            };
        default:
            return state;
    }
};

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    
    const [state, dispatch] = useReducer(projectReducer, {
        projects: [],
        activeProjectId: localStorage.getItem('activeProjectId'),
        loading: true
    });

    const { projects, activeProjectId, loading } = state;

    // Ref to access current activeProjectId inside useEffect closure without adding it to dependencies
    const activeProjectIdRef = useRef(activeProjectId);

    const activeProject = projects.find(p => p.id === activeProjectId) || null;

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

        const unsubscribe = storage.subscribeToProjects(user.uid, async (fetchedProjects) => {
            const currentActiveId = activeProjectIdRef.current;
            let nextActiveId = currentActiveId;

            if (fetchedProjects.length === 0) {
                // No projects exist. Create Default Project.
                const defaultProject: Project = {
                    id: crypto.randomUUID(),
                    name: 'Default Project',
                    description: 'Your existing work',
                    createdAt: Date.now(),
                    updatedAt: Date.now()
                };

                // Save default project
                await storage.saveProject(user.uid, defaultProject);

                // Trigger Migration of Legacy Data
                await storage.migrateLegacyData(user.uid, defaultProject.id);

                nextActiveId = defaultProject.id;
            } else {
                // Projects exist. Check if active project is still valid.
                const isValid = currentActiveId && fetchedProjects.find(p => p.id === currentActiveId);

                if (!isValid) {
                    if (fetchedProjects.length === 1) {
                        nextActiveId = fetchedProjects[0].id;
                    } else {
                        nextActiveId = null;
                    }
                }
            }

            dispatch({ 
                type: 'SET_DATA', 
                payload: { 
                    projects: fetchedProjects, 
                    activeProjectId: nextActiveId, 
                    loading: false 
                } 
            });
        });

        return () => unsubscribe();
    }, [user]);

    const createProject = async (name: string, description: string, url?: string) => {
        if (!user) return;
        const newProject: Project = {
            id: crypto.randomUUID(),
            name,
            description,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            url
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

    return (
        <ProjectContext.Provider value={{
            projects,
            activeProject,
            activeProjectId,
            createProject,
            selectProject,
            deleteProject,
            loading
        }}>
            {children}
        </ProjectContext.Provider>
    );
};
