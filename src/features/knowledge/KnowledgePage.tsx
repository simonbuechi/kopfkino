import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { KnowledgeList } from './KnowledgeList';
import { KnowledgeDetail } from './KnowledgeDetail';
import { KnowledgeForm } from './KnowledgeForm';

export const KnowledgePage: React.FC = () => {
    return (
        <Routes>
            <Route index element={<KnowledgeList />} />
            <Route path="new" element={<KnowledgeForm />} />
            <Route path=":id" element={<KnowledgeDetail />} />
            <Route path=":id/edit" element={<KnowledgeForm />} />
        </Routes>
    );
};
