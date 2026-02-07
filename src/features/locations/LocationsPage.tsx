import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { LocationList } from './LocationList';
import { LocationForm } from './LocationForm';
import { LocationDetail } from './LocationDetail';

export const LocationsPage: React.FC = () => {
    return (
        <Routes>
            <Route index element={<LocationList />} />
            <Route path="new" element={<LocationForm />} />
            <Route path=":id" element={<LocationDetail />} />
            <Route path=":id/edit" element={<LocationForm />} />
        </Routes>
    );
};
