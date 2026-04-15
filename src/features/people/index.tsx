import { Routes, Route } from 'react-router-dom';
import { PersonList } from './PersonList';
import { PersonDetail } from './PersonDetail';

export const PeoplePage = () => {
    return (
        <Routes>
            <Route index element={<PersonList />} />
            <Route path="new" element={<PersonDetail />} />
            <Route path=":id" element={<PersonDetail />} />
        </Routes>
    );
};
