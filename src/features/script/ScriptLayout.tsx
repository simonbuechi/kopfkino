import React from 'react';
import { Outlet } from 'react-router-dom';

export const ScriptLayout: React.FC = () => {
    return (
        <div className="w-full">
            <Outlet />
        </div>
    );
};
