import { useState, useEffect } from 'react';
import { Outlet, useParams, useNavigate, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useProjects } from '../context/ProjectContext';
import { Sun, Moon, Settings as SettingsIcon, LogOut, Clapperboard, ArrowRightLeft } from 'lucide-react';
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
            // Actually, if we are at root "/", we generally want to see the project list (StartPage).
            // But StartPage handles "if (!activeProjectId)".
            // If we have activeProjectId, StartPage might auto-redirect? 
            // Let's decide: URL is source of truth.
            selectProject(null);
        }
    }, [projectId, location.pathname]);

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
                            <div className="flex items-center gap-2 group">
                                <div className="flex items-center gap-2 text-sm font-semibold text-primary-900 dark:text-primary-100">
                                    <Clapperboard size={18} className="text-primary-900 dark:text-primary-100" />
                                    <span>{activeProject.name}</span>
                                </div>
                                <button
                                    onClick={handleSwitchProject}
                                    className="ml-2 p-1.5 rounded-md text-primary-400 hover:text-primary-900 dark:hover:text-primary-100 hover:bg-primary-100 dark:hover:bg-primary-700 transition-all opacity-0 group-hover:opacity-100"
                                    title="Switch Project"
                                >
                                    <ArrowRightLeft size={14} />
                                </button>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={signOut}
                            className="p-2 rounded-md hover:bg-primary-100 dark:hover:bg-primary-800 text-primary-500 dark:text-primary-400 transition-colors"
                            aria-label="Sign Out"
                            title="Sign Out"
                        >
                            <LogOut size={18} />
                        </button>
                        <div className="w-px h-6 bg-primary-200 dark:bg-primary-800 mx-1"></div>
                        <button
                            onClick={() => setIsSettingsOpen(true)}
                            className="p-2 rounded-md hover:bg-primary-100 dark:hover:bg-primary-800 text-primary-500 dark:text-primary-400 transition-colors"
                            aria-label="Settings"
                        >
                            <SettingsIcon size={18} />
                        </button>
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-md hover:bg-primary-100 dark:hover:bg-primary-800 text-primary-500 dark:text-primary-400 transition-colors"
                            aria-label="Toggle Theme"
                        >
                            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                        </button>
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
