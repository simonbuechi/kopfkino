import { describe, it, expect } from 'vitest';
import { canWrite } from '../utils/writeGuard';

describe('canWrite', () => {
    it('returns false when activeProjectId is null', () => {
        expect(canWrite(null, 'owner')).toBe(false);
    });

    it('returns false when activeProjectId is empty string', () => {
        expect(canWrite('', 'owner')).toBe(false);
    });

    it('returns false for viewer role', () => {
        expect(canWrite('project-1', 'viewer')).toBe(false);
    });

    it('returns true for owner role', () => {
        expect(canWrite('project-1', 'owner')).toBe(true);
    });

    it('returns true for editor role', () => {
        expect(canWrite('project-1', 'editor')).toBe(true);
    });

    it('returns false when role is null (user not in members)', () => {
        expect(canWrite('project-1', null)).toBe(false);
    });

    it('viewer with valid project id is still blocked', () => {
        expect(canWrite('abc123', 'viewer')).toBe(false);
    });

    it('owner with null project id is blocked', () => {
        expect(canWrite(null, 'owner')).toBe(false);
    });
});
