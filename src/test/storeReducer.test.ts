import { describe, it, expect } from 'vitest';
import { storeReducer, storeInitialState, DEFAULT_SETTINGS } from '../context/reducers';
import type { StoreState, StoreAction } from '../context/reducers';
import type { Location, Scene, Character, Schedule, Asset, Person, Settings } from '../types/types';

const makeLocation = (id: string): Location => ({
    id,
    projectId: 'p1',
    name: `Location ${id}`,
    description: '',
});

const makeScene = (id: string): Scene => ({
    id,
    projectId: 'p1',
    number: '1',
    name: `Scene ${id}`,
    description: '',
    locationId: '',
});

const makeCharacter = (id: string): Character => ({
    id,
    projectId: 'p1',
    name: `Character ${id}`,
    description: '',
});

describe('storeReducer', () => {
    it('returns initial state for unknown action', () => {
        const result = storeReducer(storeInitialState, { type: 'RESET' });
        expect(result).toEqual(storeInitialState);
    });

    it('RESET returns initial state regardless of current state', () => {
        const dirty: StoreState = {
            ...storeInitialState,
            locations: [makeLocation('loc1')],
            scenes: [makeScene('s1')],
        };
        expect(storeReducer(dirty, { type: 'RESET' })).toEqual(storeInitialState);
    });

    it('SET_LOCATIONS replaces locations', () => {
        const locs = [makeLocation('a'), makeLocation('b')];
        const result = storeReducer(storeInitialState, { type: 'SET_LOCATIONS', payload: locs });
        expect(result.locations).toEqual(locs);
        expect(result.scenes).toEqual([]);
    });

    it('SET_SCENES replaces scenes and does not touch other fields', () => {
        const withLocs: StoreState = { ...storeInitialState, locations: [makeLocation('x')] };
        const scenes = [makeScene('s1')];
        const result = storeReducer(withLocs, { type: 'SET_SCENES', payload: scenes });
        expect(result.scenes).toEqual(scenes);
        expect(result.locations).toEqual(withLocs.locations);
    });

    it('SET_CHARACTERS replaces characters', () => {
        const chars = [makeCharacter('c1')];
        const result = storeReducer(storeInitialState, { type: 'SET_CHARACTERS', payload: chars });
        expect(result.characters).toEqual(chars);
    });

    it('SET_SCHEDULES replaces schedules', () => {
        const schedules: Schedule[] = [{
            id: 'sch1', projectId: 'p1', date: '2026-01-01', name: 'Day 1',
            items: [], createdAt: 0, updatedAt: 0,
        }];
        const result = storeReducer(storeInitialState, { type: 'SET_SCHEDULES', payload: schedules });
        expect(result.schedules).toEqual(schedules);
    });

    it('SET_ASSETS replaces assets', () => {
        const assets: Asset[] = [{
            id: 'a1', projectId: 'p1', name: 'Camera', description: '', type: 'Equipment', owner: 'Simon',
        }];
        const result = storeReducer(storeInitialState, { type: 'SET_ASSETS', payload: assets });
        expect(result.assets).toEqual(assets);
    });

    it('SET_PEOPLE replaces people', () => {
        const people: Person[] = [{
            id: 'p1', projectId: 'proj1', name: 'Alice', description: '',
            type: 'Crew', role: 'DP', phone: '', email: '',
        }];
        const result = storeReducer(storeInitialState, { type: 'SET_PEOPLE', payload: people });
        expect(result.people).toEqual(people);
    });

    it('SET_SETTINGS replaces settings', () => {
        const settings: Settings = { aspectRatio: '1:1', useRandomSeed: false, customSeed: 42 };
        const result = storeReducer(storeInitialState, { type: 'SET_SETTINGS', payload: settings });
        expect(result.settings).toEqual(settings);
    });

    it('is idempotent: applying same action twice yields same result', () => {
        const locs = [makeLocation('a')];
        const action: StoreAction = { type: 'SET_LOCATIONS', payload: locs };
        const once = storeReducer(storeInitialState, action);
        const twice = storeReducer(once, action);
        expect(once).toEqual(twice);
    });

    it('DEFAULT_SETTINGS has expected shape', () => {
        expect(DEFAULT_SETTINGS.aspectRatio).toBe('16:9');
        expect(DEFAULT_SETTINGS.useRandomSeed).toBe(true);
    });
});
