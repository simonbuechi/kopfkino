import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { storage } from '../services/storage';
import type { Project } from '../types/types';

interface ProjectContextType {
    projects: Project[];
    activeProject: Project | null;
    activeProjectId: string | null;
    createProject: (name: string, description: string, url?: string) => Promise<void>;
    selectProject: (projectId: string | null) => void;
    deleteProject: (projectId: string) => Promise<void>;
    loading: boolean;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [projects, setProjects] = useState<Project[]>([]);
    const [activeProjectId, setActiveProjectId] = useState<string | null>(() => {
        return localStorage.getItem('activeProjectId');
    });
    const [loading, setLoading] = useState(true);

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
            setProjects([]);
            setActiveProjectId(null);
            setLoading(false);
            return;
        }

        const unsubscribe = storage.subscribeToProjects(user.uid, async (fetchedProjects) => {
            setProjects(fetchedProjects);

            const currentActiveId = activeProjectIdRef.current;

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

                setActiveProjectId(defaultProject.id);
            } else {
                // Projects exist. Check if active project is still valid.
                const isValid = currentActiveId && fetchedProjects.find(p => p.id === currentActiveId);

                if (!isValid) {
                    if (fetchedProjects.length === 1) {
                        // Only one project exists, auto-select it
                        setActiveProjectId(fetchedProjects[0].id);
                    } else {
                        // Multiple projects, user must select
                        setActiveProjectId(null);
                    }
                }
            }

            setLoading(false);
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
        setActiveProjectId(newProject.id);
    };

    const selectProject = (projectId: string | null) => {
        setActiveProjectId(projectId);
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

export const useProjects = () => {
    const context = useContext(ProjectContext);
    if (context === undefined) {
        throw new Error('useProjects must be used within a ProjectProvider');
    }
    return context;
};
