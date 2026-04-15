import { createContext } from 'react';
import type { Project } from '../types/types';

export interface ProjectContextType {
    projects: Project[];
    activeProject: Project | null;
    activeProjectId: string | null;
    createProject: (name: string, description: string, url?: string) => Promise<void>;
    selectProject: (projectId: string | null) => void;
    deleteProject: (projectId: string) => Promise<void>;
    loading: boolean;
}

export const ProjectContext = createContext<ProjectContextType | undefined>(undefined);
