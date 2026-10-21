import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { PlanList } from './PlanList';
import { PlanDetail } from './PlanDetail';

export const PlanningPage: React.FC = () => {
    return (
        <Routes>
            <Route index element={<PlanList />} />
            <Route path=":planId" element={<PlanDetail />} />
        </Routes>
    );
};

export default PlanningPage;
