import React from 'react';
import { NavLink } from 'react-router-dom';
import { MapPin, Clapperboard, LayoutDashboard, User } from 'lucide-react';
import clsx from 'clsx';

export const Sidebar: React.FC = () => {
    const linkClass = ({ isActive }: { isActive: boolean }) => clsx(
        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
        isActive
            ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-800"
            : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-100"
    );

    return (
        <aside className="w-64 flex flex-col h-full bg-zinc-50 dark:bg-black border-r border-zinc-200 dark:border-zinc-800 shrink-0 p-3">
            <div className="px-3 py-4 mb-2 flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-zinc-900 dark:bg-white flex items-center justify-center">
                    <span className="text-white dark:text-zinc-900 font-bold text-xs">K</span>
                </div>
                <span className="font-semibold text-zinc-900 dark:text-white tracking-tight">Kopfkino</span>
            </div>
            <nav className="flex flex-col gap-1">
                <NavLink to="/" className={linkClass}>
                    <LayoutDashboard size={18} />
                    <span>Dashboard</span>
                </NavLink>
                <NavLink to="/locations" className={linkClass}>
                    <MapPin size={18} />
                    <span>Locations</span>
                </NavLink>
                <NavLink to="/scenes" className={linkClass}>
                    <Clapperboard size={18} />
                    <span>Scenes</span>
                </NavLink>
                <NavLink to="/characters" className={linkClass}>
                    <User size={18} />
                    <span>Characters</span>
                </NavLink>
            </nav>
        </aside>
    );
};
