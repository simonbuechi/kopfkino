import { useReducer, useEffect, useCallback } from 'react';
import type { Location, Scene, Shot, Settings, Character, Schedule, Asset, Person } from '../types/types';
import { storage } from '../services/storage';
import { useAuth } from './useAuth';
import { useProjects } from './useProjects';

const DEFAULT_SETTINGS: Settings = {
    aspectRatio: '16:9',
    useRandomSeed: true
};

type StoreState = {
    locations: Location[];
    scenes: Scene[];
    characters: Character[];
    schedules: Schedule[];
    assets: Asset[];
    people: Person[];
    settings: Settings;
};

type StoreAction = 
    | { type: 'SET_LOCATIONS'; payload: Location[] }
    | { type: 'SET_SCENES'; payload: Scene[] }
    | { type: 'SET_CHARACTERS'; payload: Character[] }
    | { type: 'SET_SCHEDULES'; payload: Schedule[] }
    | { type: 'SET_ASSETS'; payload: Asset[] }
    | { type: 'SET_PEOPLE'; payload: Person[] }
    | { type: 'SET_SETTINGS'; payload: Settings }
    | { type: 'RESET' };

const initialState: StoreState = {
    locations: [],
    scenes: [],
    characters: [],
    schedules: [],
    assets: [],
    people: [],
    settings: DEFAULT_SETTINGS
};

function storeReducer(state: StoreState, action: StoreAction): StoreState {
    switch (action.type) {
        case 'SET_LOCATIONS': return { ...state, locations: action.payload };
        case 'SET_SCENES': return { ...state, scenes: action.payload };
        case 'SET_CHARACTERS': return { ...state, characters: action.payload };
        case 'SET_SCHEDULES': return { ...state, schedules: action.payload };
        case 'SET_ASSETS': return { ...state, assets: action.payload };
        case 'SET_PEOPLE': return { ...state, people: action.payload };
        case 'SET_SETTINGS': return { ...state, settings: action.payload };
        case 'RESET': return initialState;
        default: return state;
    }
}

export const useStore = () => {
    const { user } = useAuth();
    const { activeProjectId } = useProjects();
    const [state, dispatch] = useReducer(storeReducer, initialState);

    const { locations, scenes, characters, schedules, assets, people, settings } = state;

    useEffect(() => {
        if (!user || !activeProjectId) {
            dispatch({ type: 'RESET' });
            return;
        }

        const unsubLocations = storage.subscribeToLocations(user.uid, activeProjectId, (payload) => dispatch({ type: 'SET_LOCATIONS', payload }));
        const unsubScenes = storage.subscribeToScenes(user.uid, activeProjectId, (payload) => dispatch({ type: 'SET_SCENES', payload }));
        const unsubCharacters = storage.subscribeToCharacters(user.uid, activeProjectId, (payload) => dispatch({ type: 'SET_CHARACTERS', payload }));
        const unsubSchedules = storage.subscribeToSchedules(user.uid, activeProjectId, (payload) => dispatch({ type: 'SET_SCHEDULES', payload }));
        const unsubAssets = storage.subscribeToAssets(user.uid, activeProjectId, (payload) => dispatch({ type: 'SET_ASSETS', payload }));
        const unsubPeople = storage.subscribeToPeople(user.uid, activeProjectId, (payload) => dispatch({ type: 'SET_PEOPLE', payload }));
        const unsubSettings = storage.subscribeToSettings(user.uid, (data) => {
            dispatch({ type: 'SET_SETTINGS', payload: data || DEFAULT_SETTINGS });
        });

        return () => {
            unsubLocations();
            unsubScenes();
            unsubCharacters();
            unsubSchedules();
            unsubAssets();
            unsubPeople();
            unsubSettings();
        };
    }, [user, activeProjectId]);

    // Locations
    const addLocation = async (loc: Location) => {
        if (!user) return;
        await storage.saveLocation(user.uid, loc);
    };
    const deleteLocation = async (id: string) => {
        if (!user) return;
        await storage.deleteLocation(user.uid, id);
    };
    const replaceLocations = async (newLocations: Location[]) => {
        if (!user) return;
        await storage.replaceAllLocations(user.uid, newLocations);
    };

    const reorderLocations = async (newOrder: Location[]) => {
        if (!user) return;
        // Optimistic update
        dispatch({ type: 'SET_LOCATIONS', payload: newOrder });
        const locationsWithOrder = newOrder.map((loc, index) => ({
            ...loc,
            order: index
        }));
        await storage.updateLocationOrders(user.uid, locationsWithOrder);
    };

    // Scenes
    const addScene = async (scene: Scene) => {
        if (!user) return;
        await storage.saveScene(user.uid, scene);
    };
    const deleteScene = async (id: string) => {
        if (!user) return;
        await storage.deleteScene(user.uid, id);
    };
    const replaceScenes = async (newScenes: Scene[]) => {
        if (!user) return;
        await storage.replaceAllScenes(user.uid, newScenes);
    };

    const reorderScenes = async (newOrder: Scene[]) => {
        if (!user) return;
        // Optimistic update
        dispatch({ type: 'SET_SCENES', payload: newOrder });
        const scenesWithOrder = newOrder.map((scene, index) => ({
            ...scene,
            order: index
        }));
        await storage.updateSceneOrders(user.uid, scenesWithOrder);
    };

    // Shots - Managed within Scenes
    const addShotToScene = async (sceneId: string, shot: Shot) => {
        if (!user) return;
        const scene = scenes.find(s => s.id === sceneId);
        if (!scene) return;

        const currentShots = scene.shots || [];
        const updatedScene = { ...scene, shots: [...currentShots, shot] };
        await storage.saveScene(user.uid, updatedScene);
    };

    const deleteShotFromScene = async (sceneId: string, shotId: string) => {
        if (!user) return;
        const scene = scenes.find(s => s.id === sceneId);
        if (!scene || !scene.shots) return;

        const updatedShots = scene.shots.filter(s => s.id !== shotId);
        const updatedScene = { ...scene, shots: updatedShots };
        await storage.saveScene(user.uid, updatedScene);
    };

    const updateShotInScene = async (sceneId: string, shot: Shot) => {
        if (!user) return;
        const scene = scenes.find(s => s.id === sceneId);
        if (!scene || !scene.shots) return;

        const updatedShots = scene.shots.map(s => s.id === shot.id ? shot : s);
        const updatedScene = { ...scene, shots: updatedShots };
        await storage.saveScene(user.uid, updatedScene);
    };

    const reorderShotsInScene = async (sceneId: string, newShots: Shot[]) => {
        if (!user) return;
        const scene = scenes.find(s => s.id === sceneId);
        if (!scene) return;

        const updatedScene = { ...scene, shots: newShots };
        await storage.saveScene(user.uid, updatedScene);
    };

    // Characters
    const addCharacter = async (character: Character) => {
        if (!user) return;
        await storage.saveCharacter(user.uid, character);
    };
    const deleteCharacter = async (id: string) => {
        if (!user) return;
        await storage.deleteCharacter(user.uid, id);
    };
    const updateCharacter = async (character: Character) => {
        if (!user) return;
        await storage.saveCharacter(user.uid, character);
    };
    const replaceCharacters = async (newCharacters: Character[]) => {
        if (!user) return;
        await storage.replaceAllCharacters(user.uid, newCharacters);
    };

    const reorderCharacters = async (newOrder: Character[]) => {
        if (!user) return;

        // Optimistic update
        dispatch({ type: 'SET_CHARACTERS', payload: newOrder });

        const charactersWithOrder = newOrder.map((char, index) => ({
            ...char,
            order: index
        }));

        await storage.updateCharacterOrders(user.uid, charactersWithOrder);
    };

    const updateSettings = async (newSettings: Settings) => {
        if (!user) return;
        await storage.saveSettings(user.uid, newSettings);
    };

    // Schedules
    const addSchedule = async (schedule: Schedule) => {
        if (!user) return;
        await storage.saveSchedule(user.uid, schedule);
    };

    const deleteSchedule = async (id: string) => {
        if (!user) return;
        await storage.deleteSchedule(user.uid, id);
    };

    const updateSchedule = async (schedule: Schedule) => {
        if (!user) return;
        await storage.saveSchedule(user.uid, schedule);
    };

    // Assets
    const addAsset = async (asset: Asset) => {
        if (!user) return;
        await storage.saveAsset(user.uid, asset);
    };
    const deleteAsset = async (id: string) => {
        if (!user) return;
        await storage.deleteAsset(user.uid, id);
    };
    const updateAsset = async (asset: Asset) => {
        if (!user) return;
        await storage.saveAsset(user.uid, asset);
    };
    const reorderAssets = async (newOrder: Asset[]) => {
        if (!user) return;
        // Optimistic update
        dispatch({ type: 'SET_ASSETS', payload: newOrder });
        const assetsWithOrder = newOrder.map((asset, index) => ({
            ...asset,
            order: index
        }));
        await storage.updateAssetOrders(user.uid, assetsWithOrder);
    };

    // People
    const addPerson = async (person: Person) => {
        if (!user) return;
        await storage.savePerson(user.uid, person);
    };
    const deletePerson = async (id: string) => {
        if (!user) return;
        await storage.deletePerson(user.uid, id);
    };
    const updatePerson = async (person: Person) => {
        if (!user) return;
        await storage.savePerson(user.uid, person);
    };
    const reorderPeople = async (newOrder: Person[]) => {
        if (!user) return;
        // Optimistic update
        dispatch({ type: 'SET_PEOPLE', payload: newOrder });
        const peopleWithOrder = newOrder.map((person, index) => ({
            ...person,
            order: index
        }));
        await storage.updatePersonOrders(user.uid, peopleWithOrder);
    };

    const refresh = useCallback(() => {
        console.log("Refresh called, but store is real-time now.");
    }, []);

    return {
        locations,
        scenes,
        characters,
        settings,
        addLocation,
        deleteLocation,
        replaceLocations,
        reorderLocations,
        addScene,
        deleteScene,
        replaceScenes,
        reorderScenes,
        addShotToScene,
        deleteShotFromScene,
        updateShotInScene,
        reorderShotsInScene,
        addCharacter,
        deleteCharacter,
        updateCharacter,
        replaceCharacters,
        reorderCharacters,
        updateSettings,
        schedules,
        addSchedule,
        deleteSchedule,
        updateSchedule,
        assets,
        addAsset,
        deleteAsset,
        updateAsset,
        reorderAssets,
        people,
        addPerson,
        deletePerson,
        updatePerson,
        reorderPeople,
        refresh,
    };
};
