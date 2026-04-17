import type { ProjectRole } from '../types/types';

/**
 * Returns true when a write should be allowed.
 * Centralises the guard logic used throughout StoreProvider.
 */
export function canWrite(activeProjectId: string | null, role: ProjectRole | null): boolean {
    if (!activeProjectId) return false;
    if (role === null || role === 'viewer') return false;
    return true;
}
