import { Routes, Route } from 'react-router-dom';
import { AssetList } from './AssetList';
import { AssetDetail } from './AssetDetail';

export const AssetsPage = () => {
    return (
        <Routes>
            <Route index element={<AssetList />} />
            <Route path="new" element={<AssetDetail />} />
            <Route path=":id" element={<AssetDetail />} />
        </Routes>
    );
};
