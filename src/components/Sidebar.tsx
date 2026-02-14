import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { MapPin, Clapperboard, LayoutDashboard, User, ChevronLeft, ChevronRight } from 'lucide-react';
import icon from '../assets/icon.png';
import clsx from 'clsx';

export const Sidebar: React.FC = () => {
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
                <div className="w-8 h-8 rounded-lg bg-zinc-900 dark:bg-zinc-950 flex items-center justify-center shrink-0 p-1.5 shadow-sm">
                    <img src={icon} alt="Kopfkino Logo" className="w-full h-full object-contain" />
                </div>
                {!isCollapsed && (
                    <span className="font-semibold text-zinc-900 dark:text-white tracking-tight overflow-hidden whitespace-nowrap animate-in fade-in duration-300">
                        Kopfkino
                    </span>
                )}
            </div>

            <nav className="flex flex-col gap-1 flex-1">
                <NavLink to="/" className={linkClass} title={isCollapsed ? "Dashboard" : undefined}>
                    <LayoutDashboard size={20} className="shrink-0" />
                    {!isCollapsed && <span>Dashboard</span>}
                </NavLink>
                <NavLink to="/locations" className={linkClass} title={isCollapsed ? "Locations" : undefined}>
                    <MapPin size={20} className="shrink-0" />
                    {!isCollapsed && <span>Locations</span>}
                </NavLink>
                <NavLink to="/scenes" className={linkClass} title={isCollapsed ? "Scenes" : undefined}>
                    <Clapperboard size={20} className="shrink-0" />
                    {!isCollapsed && <span>Scenes</span>}
                </NavLink>
                <NavLink to="/characters" className={linkClass} title={isCollapsed ? "Characters" : undefined}>
                    <User size={20} className="shrink-0" />
                    {!isCollapsed && <span>Characters</span>}
                </NavLink>
            </nav>

            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="absolute -right-3 top-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-full p-1 text-zinc-400 hover:text-zinc-900 dark:hover:text-white shadow-sm hover:shadow-md transition-all z-10"
                aria-label={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
                {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>
        </aside>
    );
};
