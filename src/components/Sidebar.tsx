import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useProjects } from '../context/ProjectContext';
import { MapPin, Clapperboard, User, ChevronLeft, ChevronRight, LayoutDashboard } from 'lucide-react';
import icon from '../assets/icon.webp';
import clsx from 'clsx';
import { version } from '../../package.json';

export const Sidebar: React.FC = () => {
    const { activeProjectId } = useProjects();
    const [isCollapsed, setIsCollapsed] = useState(() => {
        const saved = localStorage.getItem('sidebar-collapsed');
        return saved === 'true';
    });

    useEffect(() => {
        localStorage.setItem('sidebar-collapsed', String(isCollapsed));
    }, [isCollapsed]);

    const linkClass = ({ isActive }: { isActive: boolean }) => clsx(
        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 overflow-hidden whitespace-nowrap",
        isActive
            ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-800"
            : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-100",
        isCollapsed && "justify-center px-2"
    );

    return (
        <aside
            className={clsx(
                "flex flex-col h-full bg-zinc-50 dark:bg-black border-r border-zinc-200 dark:border-zinc-800 shrink-0 transition-all duration-300 relative",
                isCollapsed ? "w-16 p-2" : "w-64 p-3"
            )}
        >
            <div className={clsx("flex items-center mb-6 transition-all duration-300", isCollapsed ? "justify-center px-0 py-4" : "px-3 py-4 gap-2")}>
                <NavLink to="/" className={clsx("flex items-center gap-2", isCollapsed ? "justify-center" : "")}>
                    <div className="w-8 h-8 flex items-center justify-center shrink-0 p-1.5">
                        <img src={icon} alt="Kopfkino Logo" className="w-full h-full object-contain" />
                    </div>
                    {!isCollapsed && (
                        <span className="font-semibold text-zinc-900 dark:text-white tracking-tight overflow-hidden whitespace-nowrap animate-in fade-in duration-300">
                            Kopfkino
                        </span>
                    )}
                </NavLink>
            </div>

            <nav className="flex flex-col gap-1 flex-1">
                {activeProjectId && (
                    <>
                        <NavLink to={`/project/${activeProjectId}`} end className={linkClass} title={isCollapsed ? "Dashboard" : undefined}>
                            <LayoutDashboard size={20} className="shrink-0" />
                            {!isCollapsed && <span>Dashboard</span>}
                        </NavLink>
                        <NavLink to={`/project/${activeProjectId}/locations`} className={linkClass} title={isCollapsed ? "Locations" : undefined}>
                            <MapPin size={20} className="shrink-0" />
                            {!isCollapsed && <span>Locations</span>}
                        </NavLink>
                        <NavLink to={`/project/${activeProjectId}/scenes`} className={linkClass} title={isCollapsed ? "Scenes" : undefined}>
                            <Clapperboard size={20} className="shrink-0" />
                            {!isCollapsed && <span>Scenes</span>}
                        </NavLink>
                        <NavLink to={`/project/${activeProjectId}/characters`} className={linkClass} title={isCollapsed ? "Characters" : undefined}>
                            <User size={20} className="shrink-0" />
                            {!isCollapsed && <span>Characters</span>}
                        </NavLink>
                    </>
                )}
            </nav>

            <div className="p-2 border-t border-zinc-200 dark:border-zinc-800 mt-auto">
                {!isCollapsed && (
                    <div className="px-3 py-2 mb-2 text-xs text-zinc-400">
                        Version {version}
                    </div>
                )}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className={clsx(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 w-full",
                        "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-100",
                        isCollapsed ? "justify-center px-2" : ""
                    )}
                    title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                >
                    {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                    {!isCollapsed && <span>Collapse</span>}
                </button>
            </div>
        </aside>
    );
};
