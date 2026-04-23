import React, { useState, useEffect } from 'react';
import { Outlet, useParams, useNavigate, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import { useProjects } from '../hooks/useProjects';
import { Sun, Moon, Settings as SettingsIcon, LogOut, ArrowRightLeft } from 'lucide-react';
import { Button } from './ui/Button';
import { Tooltip } from './ui/Tooltip';
import { SettingsDialog } from '../features/settings/SettingsDialog';

export const Layout: React.FC = () => {
    const { theme, toggleTheme } = useTheme();
    const { signOut } = useAuth();
    const { activeProject, selectProject, activeProjectId } = useProjects();
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Route synchronization
    const { projectId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    // Sync URL -> Context
    useEffect(() => {
        if (projectId && projectId !== activeProjectId) {
            selectProject(projectId);
        } else if (!projectId && activeProjectId && location.pathname === '/') {
            // If explicit root visit and context has project, decide if we clear it.
            selectProject(null);
        }
    }, [projectId, location.pathname, activeProjectId, selectProject]);

    // Handle Switch Project
    const handleSwitchProject = () => {
        selectProject(null);
        navigate('/');
    };

    return (
        <div className="flex h-screen w-full bg-primary-50 dark:bg-black text-primary-900 dark:text-primary-100 overflow-hidden">
            <Sidebar />
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <header className="h-14 px-6 flex items-center justify-between border-b border-primary-200 dark:border-primary-800 bg-white/50 dark:bg-primary-950/50 backdrop-blur-sm shrink-0">
                    <div className="flex-1 flex items-center">
                        {activeProject && (
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-primary-900 dark:text-primary-100">
                                    {activeProject.name}
                                </span>
                                <Tooltip label="Switch project">
                                    <button
                                        onClick={handleSwitchProject}
                                        className="p-1.5 rounded-md text-primary-400 hover:text-primary-900 dark:hover:text-primary-100 hover:bg-primary-100 dark:hover:bg-primary-700 transition-colors"
                                    >
                                        <ArrowRightLeft size={14} />
                                    </button>
                                </Tooltip>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-1">
                        <Tooltip label="Sign out">
                            <Button variant="ghost" size="icon" onClick={signOut} aria-label="Sign Out">
                                <LogOut size={18} />
                            </Button>
                        </Tooltip>
                        <div className="w-px h-6 bg-primary-200 dark:bg-primary-800 mx-1" />
                        <Tooltip label="Settings">
                            <Button variant="ghost" size="icon" onClick={() => setIsSettingsOpen(true)} aria-label="Settings">
                                <SettingsIcon size={18} />
                            </Button>
                        </Tooltip>
                        <Tooltip label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}>
                            <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle Theme">
                                {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                            </Button>
                        </Tooltip>
                    </div>
                </header>
                <div className="flex-1 overflow-y-auto p-8">
                    <Outlet />
                </div>
            </main>
            <SettingsDialog isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
        </div>
    );
};
