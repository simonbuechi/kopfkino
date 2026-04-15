import { useContext } from 'react';
import { ProjectContext } from '../context/ProjectContextObject';

export const useProjects = () => {
    const context = useContext(ProjectContext);
    if (context === undefined) {
        throw new Error('useProjects must be used within a ProjectProvider');
    }
    return context;
};
