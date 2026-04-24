import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useProjects } from '../../hooks/useProjects';
import clsx from 'clsx';

const tabs = [
    { label: 'Script',    path: '' },
    { label: 'Beats',     path: 'beats' },
    { label: 'Revisions', path: 'revisions' },
];

export const ScriptLayout: React.FC = () => {
    const { activeProjectId } = useProjects();
    const base = `/project/${activeProjectId}/script`;

    return (
        <div className="w-full">
            <div className="flex gap-1 mb-6 border-b border-primary-200 dark:border-primary-800">
                {tabs.map(({ label, path }) => (
                    <NavLink
                        key={label}
                        to={path ? `${base}/${path}` : base}
                        end
                        className={({ isActive }) => clsx(
                            'px-4 py-2 text-sm font-semibold transition-colors border-b-2 -mb-px',
                            isActive
                                ? 'border-secondary-500 text-secondary-600 dark:text-secondary-400'
                                : 'border-transparent text-primary-500 dark:text-primary-400 hover:text-primary-900 dark:hover:text-primary-100'
                        )}
                    >
                        {label}
                    </NavLink>
                ))}
            </div>
            <Outlet />
        </div>
    );
};
