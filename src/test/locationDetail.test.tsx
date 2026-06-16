import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import type { Location } from '../types/types';
import { DEFAULT_SETTINGS } from '../context/reducers';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockSaveLocation = vi.fn();
const mockDeleteLocation = vi.fn();

const BASE_LOCATION: Location = {
    id: 'loc-1',
    projectId: 'proj-1',
    name: 'Rooftop',
    description: 'A city rooftop',
    geolocation: '',
    comment: '',
    images: [],
    thumbnailUrl: '',
    order: 0,
};

vi.mock('../hooks/useStore', () => ({
    useStore: () => ({
        locations: [BASE_LOCATION],
        scenes: [],
        settings: DEFAULT_SETTINGS,
        saveLocation: mockSaveLocation,
        deleteLocation: mockDeleteLocation,
    }),
}));

vi.mock('../hooks/useAuth', () => ({
    useAuth: () => ({ user: { uid: 'user-1', email: 'test@test.com' } }),
}));

vi.mock('../hooks/useProjects', () => ({
    useProjects: () => ({ activeProjectId: 'proj-1', activeProjectRole: 'owner' }),
}));

vi.mock('react-router-dom', async (importOriginal) => {
    const actual = await importOriginal<typeof import('react-router-dom')>();
    return { ...actual, useNavigate: () => vi.fn() };
});

vi.mock('../services/storageService', () => ({
    deleteImageFromUrl: vi.fn(),
    uploadFile: vi.fn(),
}));

import { LocationDetail } from '../features/locations/LocationDetail';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderDetail(locationId = 'loc-1') {
    return render(
        <MemoryRouter initialEntries={[`/locations/${locationId}`]}>
            <Routes>
                <Route path="/locations/:id" element={<LocationDetail />} />
            </Routes>
        </MemoryRouter>
    );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('LocationDetail', () => {
    beforeEach(() => {
        mockSaveLocation.mockResolvedValue(undefined);
        mockDeleteLocation.mockResolvedValue(undefined);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    // --- Render ---

    it('renders the location name in the input', () => {
        renderDetail();
        expect(screen.getByDisplayValue('Rooftop')).toBeInTheDocument();
    });

    it('renders the description textarea', () => {
        renderDetail();
        expect(screen.getByDisplayValue('A city rooftop')).toBeInTheDocument();
    });

    it('shows "Location not found" for unknown id', () => {
        renderDetail('unknown-id');
        expect(screen.getByText(/location not found/i)).toBeInTheDocument();
    });

    // --- Save actions ---

    it('calls saveLocation when name is modified and Save button is clicked', async () => {
        renderDetail();
        const nameInput = screen.getByDisplayValue('Rooftop');
        fireEvent.change(nameInput, { target: { value: 'Warehouse' } });

        const saveButton = screen.getByRole('button', { name: /save/i });
        expect(saveButton).not.toBeDisabled();
        
        await act(async () => {
            fireEvent.click(saveButton);
        });

        expect(mockSaveLocation).toHaveBeenCalledOnce();
        expect(mockSaveLocation).toHaveBeenCalledWith(
            expect.objectContaining({ name: 'Warehouse' })
        );
    });

    it('shows "Saved" after a successful save', async () => {
        renderDetail();
        const nameInput = screen.getByDisplayValue('Rooftop');
        fireEvent.change(nameInput, { target: { value: 'Warehouse' } });

        const saveButton = screen.getByRole('button', { name: /save/i });
        await act(async () => {
            fireEvent.click(saveButton);
        });

        expect(screen.getByText(/^saved$/i)).toBeInTheDocument();
    });

    it('shows "Error saving" when saveLocation throws', async () => {
        mockSaveLocation.mockRejectedValue(new Error('permission-denied'));
        renderDetail();
        const nameInput = screen.getByDisplayValue('Rooftop');
        fireEvent.change(nameInput, { target: { value: 'Warehouse' } });

        const saveButton = screen.getByRole('button', { name: /save/i });
        await act(async () => {
            fireEvent.click(saveButton);
        });

        expect(screen.getByText(/error saving/i)).toBeInTheDocument();
    });

    it('disables save button when name is empty', async () => {
        renderDetail();
        const nameInput = screen.getByDisplayValue('Rooftop');
        fireEvent.change(nameInput, { target: { value: '' } });

        const saveButton = screen.getByRole('button', { name: /save/i });
        expect(saveButton).toBeDisabled();
    });

    it('passes the full location object to saveLocation on manual save', async () => {
        renderDetail();
        const descInput = screen.getByDisplayValue('A city rooftop');
        fireEvent.change(descInput, { target: { value: 'New description' } });

        const saveButton = screen.getByRole('button', { name: /save/i });
        await act(async () => {
            fireEvent.click(saveButton);
        });

        expect(mockSaveLocation).toHaveBeenCalledWith(
            expect.objectContaining({
                id: 'loc-1',
                projectId: 'proj-1',
                description: 'New description',
            })
        );
    });
});
