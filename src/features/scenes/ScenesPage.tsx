import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { SceneList } from './SceneList';
import { SceneForm } from './SceneForm';
import { SceneDetail } from './SceneDetail';
import { ShotDetail } from '../shots/ShotDetail';
import { ShotsPage } from '../shots/ShotsPage';

export const ScenesPage: React.FC = () => {
    return (
        <Routes>
            <Route index element={<SceneList />} />
            <Route path="shots" element={<ShotsPage />} />
            <Route path="new" element={<SceneForm />} />
            <Route path=":id" element={<SceneDetail />} />
            <Route path=":id/edit" element={<SceneForm />} />
            <Route path=":id/shots" element={<ShotsPage />} />
            <Route path=":id/shots/:shotId" element={<ShotDetail />} />
        </Routes>
    );
};
