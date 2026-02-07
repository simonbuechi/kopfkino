import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { SceneList } from './SceneList';
import { SceneForm } from './SceneForm';
import { SceneDetail } from './SceneDetail';
import { ShotForm } from '../shots/ShotForm';

export const ScenesPage: React.FC = () => {
    return (
        <Routes>
            <Route index element={<SceneList />} />
            <Route path="new" element={<SceneForm />} />
            <Route path=":id" element={<SceneDetail />} />
            <Route path=":id/edit" element={<SceneForm />} />
            <Route path=":id/shots/new" element={<ShotForm />} />
            <Route path=":id/shots/:shotId/edit" element={<ShotForm />} />
        </Routes>
    );
};
