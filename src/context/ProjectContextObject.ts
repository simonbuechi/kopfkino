import { createContext } from 'react';
import type { Project, ProjectRole } from '../types/types';

export interface ProjectContextType {
    projects: Project[];
    activeProject: Project | null;
    activeProjectId: string | null;
    activeProjectRole: ProjectRole | null;
    createProject: (name: string, description: string, url?: string) => Promise<void>;
    selectProject: (projectId: string | null) => void;
    deleteProject: (projectId: string) => Promise<void>;
    shareProject: (projectId: string, inviteeEmail: string, role: ProjectRole) => Promise<void>;
    removeMember: (projectId: string, targetUserId: string) => Promise<void>;
    updateMemberRole: (projectId: string, targetUserId: string, role: ProjectRole) => Promise<void>;
    transferOwnership: (projectId: string, newOwnerId: string) => Promise<void>;
    loading: boolean;
}

export const ProjectContext = createContext<ProjectContextType | undefined>(undefined);
