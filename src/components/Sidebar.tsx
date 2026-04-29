import React, { useState, useEffect, useCallback } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useProjects } from '../hooks/useProjects';
import { MapPin, Clapperboard, User, ChevronLeft, ChevronRight, Calendar, Package, Users, ScrollText, Columns3, Clock, Film } from 'lucide-react';
import icon from '../assets/icon.webp';
import clsx from 'clsx';
import { version } from '../../package.json';

const SectionLabel: React.FC<{ label: string; collapsed: boolean }> = ({ label, collapsed }) => (
    collapsed
        ? <div className="my-2 border-t border-primary-200 dark:border-primary-800 mx-1" />
        : <p className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-widest text-primary-400 dark:text-primary-600 select-none">{label}</p>
);

export const Sidebar: React.FC = () => {
    const { activeProjectId } = useProjects();
    const location = useLocation();
    const isOnScript = location.pathname.includes('/script');
    const isOnScenes = location.pathname.includes('/scenes');
    const [isCollapsed, setIsCollapsed] = useState(() => {
        const saved = localStorage.getItem('sidebar-collapsed');
        return saved === 'true';
    });

    useEffect(() => {
        localStorage.setItem('sidebar-collapsed', String(isCollapsed));
    }, [isCollapsed]);

    const linkClass = useCallback(({ isActive }: { isActive: boolean }) => clsx(
        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 overflow-hidden whitespace-nowrap",
        isActive
            ? "bg-white dark:bg-primary-900 text-primary-900 dark:text-white shadow-sm ring-1 ring-primary-200 dark:ring-primary-800"
            : "text-primary-500 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900 hover:text-primary-900 dark:hover:text-primary-100",
        isCollapsed && "justify-center px-2"
    ), [isCollapsed]);

    return (
        <aside
            className={clsx(
                "flex flex-col h-full bg-primary-50 dark:bg-black border-r border-primary-200 dark:border-primary-800 shrink-0 transition-all duration-300 relative",
                isCollapsed ? "w-16 p-2" : "w-64 p-3"
            )}
        >
            <div className={clsx("flex items-center mb-6 transition-all duration-300", isCollapsed ? "justify-center px-0 py-4" : "px-3 py-4 gap-2")}>
                <NavLink to={activeProjectId ? `/project/${activeProjectId}` : "/"} className={clsx("flex items-center gap-2", isCollapsed ? "justify-center" : "")}>
                    <div className="w-8 h-8 flex items-center justify-center shrink-0 p-1.5">
                        <img src={icon} alt="Kopfkino Logo" className="w-full h-full object-contain" />
                    </div>
                    {!isCollapsed && (
                        <span className="text-xl font-bold text-primary-900 dark:text-white tracking-tight overflow-hidden whitespace-nowrap animate-in fade-in duration-300">
                            Kopfkino
                        </span>
                    )}
                </NavLink>
            </div>

            <nav className="flex flex-col gap-1 flex-1">
                {activeProjectId && (
                    <>
                        <SectionLabel label="Writing" collapsed={isCollapsed} />
                        <NavLink to={`/project/${activeProjectId}/script`} end className={linkClass} title={isCollapsed ? "Script" : undefined}>
                            <ScrollText size={20} className="shrink-0" />
                            {!isCollapsed && <span>Script</span>}
                        </NavLink>
                        {isOnScript && !isCollapsed && (
                            <div className="flex flex-col gap-1 ml-4 pl-3 border-l border-primary-200 dark:border-primary-800">
                                <NavLink to={`/project/${activeProjectId}/script/beats`} className={linkClass}>
                                    <Columns3 size={16} className="shrink-0" />
                                    <span>Beats</span>
                                </NavLink>
                                <NavLink to={`/project/${activeProjectId}/script/revisions`} className={linkClass}>
                                    <Clock size={16} className="shrink-0" />
                                    <span>Revisions</span>
                                </NavLink>
                            </div>
                        )}

                        <SectionLabel label="Creative" collapsed={isCollapsed} />
                        <NavLink to={`/project/${activeProjectId}/characters`} className={linkClass} title={isCollapsed ? "Characters" : undefined}>
                            <User size={20} className="shrink-0" />
                            {!isCollapsed && <span>Characters</span>}
                        </NavLink>
                        <NavLink to={`/project/${activeProjectId}/locations`} className={linkClass} title={isCollapsed ? "Locations" : undefined}>
                            <MapPin size={20} className="shrink-0" />
                            {!isCollapsed && <span>Locations</span>}
                        </NavLink>
                        <NavLink to={`/project/${activeProjectId}/scenes`} end className={linkClass} title={isCollapsed ? "Scenes" : undefined}>
                            <Clapperboard size={20} className="shrink-0" />
                            {!isCollapsed && <span>Scenes</span>}
                        </NavLink>
                        {isOnScenes && !isCollapsed && (
                            <div className="flex flex-col gap-1 ml-4 pl-3 border-l border-primary-200 dark:border-primary-800">
                                <NavLink to={`/project/${activeProjectId}/scenes/shots`} className={linkClass}>
                                    <Film size={16} className="shrink-0" />
                                    <span>Shots</span>
                                </NavLink>
                            </div>
                        )}

                        <SectionLabel label="Manage" collapsed={isCollapsed} />
                        <NavLink to={`/project/${activeProjectId}/people`} className={linkClass} title={isCollapsed ? "People" : undefined}>
                            <Users size={20} className="shrink-0" />
                            {!isCollapsed && <span>People</span>}
                        </NavLink>
                        <NavLink to={`/project/${activeProjectId}/assets`} className={linkClass} title={isCollapsed ? "Assets" : undefined}>
                            <Package size={20} className="shrink-0" />
                            {!isCollapsed && <span>Assets</span>}
                        </NavLink>
                        <NavLink to={`/project/${activeProjectId}/scheduling`} className={linkClass} title={isCollapsed ? "Scheduling" : undefined}>
                            <Calendar size={20} className="shrink-0" />
                            {!isCollapsed && <span>Scheduling</span>}
                        </NavLink>
                    </>
                )}
            </nav>

            <div className="p-2 border-t border-primary-200 dark:border-primary-800 mt-auto">
                {!isCollapsed && (
                    <div className="px-3 py-2 mb-2 text-xs text-primary-400">
                        Version {version}
                    </div>
                )}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className={clsx(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 w-full",
                        "text-primary-500 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900 hover:text-primary-900 dark:hover:text-primary-100",
                        isCollapsed ? "justify-center px-2" : ""
                    )}
                    title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                >
                    {isCollapsed ? <ChevronRight size={20} className="shrink-0" /> : <ChevronLeft size={20} className="shrink-0" />}
                    {!isCollapsed && <span>Collapse</span>}
                </button>
            </div>
        </aside>
    );
};
