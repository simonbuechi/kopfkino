import { describe, it, expect } from 'vitest';
import { projectReducer, projectInitialState } from '../context/reducers';
import type { Project } from '../types/types';

const makeProject = (id: string, ownerId = 'user1'): Project => ({
    id,
    name: `Project ${id}`,
    description: '',
    createdAt: 1000,
    updatedAt: 1000,
    ownerId,
    members: { [ownerId]: { role: 'owner', email: 'a@b.com', displayName: 'A', addedAt: 1000 } },
});

describe('projectReducer', () => {
    it('returns initial state on RESET', () => {
        const state = { projects: [makeProject('p1')], activeProjectId: 'p1', loading: false };
        expect(projectReducer(state, { type: 'RESET' })).toEqual({
            projects: [],
            activeProjectId: null,
            loading: false,
        });
    });

    it('SET_DATA merges partial state', () => {
        const projects = [makeProject('p1')];
        const result = projectReducer(projectInitialState, {
            type: 'SET_DATA',
            payload: { projects, loading: false },
        });
        expect(result.projects).toEqual(projects);
        expect(result.loading).toBe(false);
        expect(result.activeProjectId).toBeNull();
    });

    it('SET_DATA sets activeProjectId', () => {
        const result = projectReducer(projectInitialState, {
            type: 'SET_DATA',
            payload: { activeProjectId: 'p1' },
        });
        expect(result.activeProjectId).toBe('p1');
    });

    it('SET_DATA does not overwrite fields not in payload', () => {
        const withProjects = projectReducer(projectInitialState, {
            type: 'SET_DATA',
            payload: { projects: [makeProject('p1')] },
        });
        const result = projectReducer(withProjects, {
            type: 'SET_DATA',
            payload: { activeProjectId: 'p1' },
        });
        expect(result.projects).toHaveLength(1);
        expect(result.activeProjectId).toBe('p1');
    });

    it('SET_DATA can clear projects with empty array', () => {
        const withProjects = projectReducer(projectInitialState, {
            type: 'SET_DATA',
            payload: { projects: [makeProject('p1'), makeProject('p2')] },
        });
        const result = projectReducer(withProjects, { type: 'SET_DATA', payload: { projects: [] } });
        expect(result.projects).toHaveLength(0);
    });

    it('initial loading state is true', () => {
        expect(projectInitialState.loading).toBe(true);
    });

    it('RESET sets loading to false', () => {
        const result = projectReducer(projectInitialState, { type: 'RESET' });
        expect(result.loading).toBe(false);
    });
});
