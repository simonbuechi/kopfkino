import { Routes, Route } from 'react-router-dom';
import { CharacterList } from './CharacterList';
import { CharacterDetail } from './CharacterDetail';

export const CharactersPage = () => {
    return (
        <Routes>
            <Route index element={<CharacterList />} />
            <Route path=":id" element={<CharacterDetail />} />
        </Routes>
    );
};
