import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Sun, Moon, Settings as SettingsIcon, LogOut } from 'lucide-react';
import { SettingsDialog } from '../features/settings/SettingsDialog';

export const Layout: React.FC = () => {
    const { theme, toggleTheme } = useTheme();
    const { signOut } = useAuth();
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    return (
        <div className="flex h-screen w-full bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100 overflow-hidden">
            <Sidebar />
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <header className="h-14 px-6 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-sm shrink-0">
                    <div className="flex-1" /> {/* Spacer to push items to right if needed, or just use justify-end on header */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={signOut}
                            className="p-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 transition-colors"
                            aria-label="Sign Out"
                            title="Sign Out"
                        >
                            <LogOut size={18} />
                        </button>
                        <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-800 mx-1"></div>
                        <button
                            onClick={() => setIsSettingsOpen(true)}
                            className="p-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 transition-colors"
                            aria-label="Settings"
                        >
                            <SettingsIcon size={18} />
                        </button>
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 transition-colors"
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
