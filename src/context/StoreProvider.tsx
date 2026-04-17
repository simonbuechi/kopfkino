import { useReducer, useEffect, useCallback } from 'react';
import type { Location, Scene, Shot, Person, Schedule, Asset, Character, Settings } from '../types/types';
import { storage } from '../services/storage';
import { useAuth } from '../hooks/useAuth';
import { useProjects } from '../hooks/useProjects';
import { StoreContext } from './StoreContextObject';
import { storeReducer, storeInitialState, DEFAULT_SETTINGS } from './reducers';
import { canWrite } from '../utils/writeGuard';

export const StoreProvider = ({ children }: { children: React.ReactNode }) => {
    const { user } = useAuth();
    const { activeProjectId, activeProjectRole } = useProjects();
    const [state, dispatch] = useReducer(storeReducer, storeInitialState);

    const { locations, scenes, characters, schedules, assets, people, settings } = state;

    const ok = () => canWrite(activeProjectId, activeProjectRole);

    useEffect(() => {
        if (!user || !activeProjectId) {
            dispatch({ type: 'RESET' });
            return;
        }

        const unsubLocations = storage.subscribeToLocations(activeProjectId, (payload) => dispatch({ type: 'SET_LOCATIONS', payload }));
        const unsubScenes = storage.subscribeToScenes(activeProjectId, (payload) => dispatch({ type: 'SET_SCENES', payload }));
        const unsubCharacters = storage.subscribeToCharacters(activeProjectId, (payload) => dispatch({ type: 'SET_CHARACTERS', payload }));
        const unsubSchedules = storage.subscribeToSchedules(activeProjectId, (payload) => dispatch({ type: 'SET_SCHEDULES', payload }));
        const unsubAssets = storage.subscribeToAssets(activeProjectId, (payload) => dispatch({ type: 'SET_ASSETS', payload }));
        const unsubPeople = storage.subscribeToPeople(activeProjectId, (payload) => dispatch({ type: 'SET_PEOPLE', payload }));
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
        if (!activeProjectId || !ok()) return;
        await storage.saveLocation(activeProjectId, loc);
    };
    const deleteLocation = async (id: string) => {
        if (!activeProjectId || !ok()) return;
        await storage.deleteLocation(activeProjectId, id);
    };
    const replaceLocations = async (newLocations: Location[]) => {
        if (!activeProjectId || !ok()) return;
        await storage.replaceAllLocations(activeProjectId, newLocations);
    };
    const reorderLocations = async (newOrder: Location[]) => {
        if (!activeProjectId || !ok()) return;
        dispatch({ type: 'SET_LOCATIONS', payload: newOrder });
        const locationsWithOrder = newOrder.map((loc, index) => ({ ...loc, order: index }));
        await storage.updateLocationOrders(activeProjectId, locationsWithOrder);
    };

    // Scenes
    const addScene = async (scene: Scene) => {
        if (!activeProjectId || !ok()) return;
        await storage.saveScene(activeProjectId, scene);
    };
    const deleteScene = async (id: string) => {
        if (!activeProjectId || !ok()) return;
        await storage.deleteScene(activeProjectId, id);
    };
    const replaceScenes = async (newScenes: Scene[]) => {
        if (!activeProjectId || !ok()) return;
        await storage.replaceAllScenes(activeProjectId, newScenes);
    };
    const reorderScenes = async (newOrder: Scene[]) => {
        if (!activeProjectId || !ok()) return;
        dispatch({ type: 'SET_SCENES', payload: newOrder });
        const scenesWithOrder = newOrder.map((scene, index) => ({ ...scene, order: index }));
        await storage.updateSceneOrders(activeProjectId, scenesWithOrder);
    };

    // Shots — embedded in Scenes
    const addShotToScene = async (sceneId: string, shot: Shot) => {
        if (!activeProjectId || !ok()) return;
        const scene = scenes.find(s => s.id === sceneId);
        if (!scene) return;
        const updatedScene = { ...scene, shots: [...(scene.shots || []), shot] };
        await storage.saveScene(activeProjectId, updatedScene);
    };
    const deleteShotFromScene = async (sceneId: string, shotId: string) => {
        if (!activeProjectId || !ok()) return;
        const scene = scenes.find(s => s.id === sceneId);
        if (!scene?.shots) return;
        const updatedScene = { ...scene, shots: scene.shots.filter(s => s.id !== shotId) };
        await storage.saveScene(activeProjectId, updatedScene);
    };
    const updateShotInScene = async (sceneId: string, shot: Shot) => {
        if (!activeProjectId || !ok()) return;
        const scene = scenes.find(s => s.id === sceneId);
        if (!scene?.shots) return;
        const updatedScene = { ...scene, shots: scene.shots.map(s => s.id === shot.id ? shot : s) };
        await storage.saveScene(activeProjectId, updatedScene);
    };
    const reorderShotsInScene = async (sceneId: string, newShots: Shot[]) => {
        if (!activeProjectId || !ok()) return;
        const scene = scenes.find(s => s.id === sceneId);
        if (!scene) return;
        await storage.saveScene(activeProjectId, { ...scene, shots: newShots });
    };

    // Characters
    const addCharacter = async (character: Character) => {
        if (!activeProjectId || !ok()) return;
        await storage.saveCharacter(activeProjectId, character);
    };
    const deleteCharacter = async (id: string) => {
        if (!activeProjectId || !ok()) return;
        await storage.deleteCharacter(activeProjectId, id);
    };
    const updateCharacter = async (character: Character) => {
        if (!activeProjectId || !ok()) return;
        await storage.saveCharacter(activeProjectId, character);
    };
    const replaceCharacters = async (newCharacters: Character[]) => {
        if (!activeProjectId || !ok()) return;
        await storage.replaceAllCharacters(activeProjectId, newCharacters);
    };
    const reorderCharacters = async (newOrder: Character[]) => {
        if (!activeProjectId || !ok()) return;
        dispatch({ type: 'SET_CHARACTERS', payload: newOrder });
        const charactersWithOrder = newOrder.map((char, index) => ({ ...char, order: index }));
        await storage.updateCharacterOrders(activeProjectId, charactersWithOrder);
    };

    // Settings (user-scoped, always writable)
    const updateSettings = async (newSettings: Settings) => {
        if (!user) return;
        await storage.saveSettings(user.uid, newSettings);
    };

    // Schedules
    const addSchedule = async (schedule: Schedule) => {
        if (!activeProjectId || !ok()) return;
        await storage.saveSchedule(activeProjectId, schedule);
    };
    const deleteSchedule = async (id: string) => {
        if (!activeProjectId || !ok()) return;
        await storage.deleteSchedule(activeProjectId, id);
    };
    const updateSchedule = async (schedule: Schedule) => {
        if (!activeProjectId || !ok()) return;
        await storage.saveSchedule(activeProjectId, schedule);
    };

    // Assets
    const addAsset = async (asset: Asset) => {
        if (!activeProjectId || !ok()) return;
        await storage.saveAsset(activeProjectId, asset);
    };
    const deleteAsset = async (id: string) => {
        if (!activeProjectId || !ok()) return;
        await storage.deleteAsset(activeProjectId, id);
    };
    const updateAsset = async (asset: Asset) => {
        if (!activeProjectId || !ok()) return;
        await storage.saveAsset(activeProjectId, asset);
    };
    const reorderAssets = async (newOrder: Asset[]) => {
        if (!activeProjectId || !ok()) return;
        dispatch({ type: 'SET_ASSETS', payload: newOrder });
        const assetsWithOrder = newOrder.map((asset, index) => ({ ...asset, order: index }));
        await storage.updateAssetOrders(activeProjectId, assetsWithOrder);
    };

    // People
    const addPerson = async (person: Person) => {
        if (!activeProjectId || !ok()) return;
        await storage.savePerson(activeProjectId, person);
    };
    const deletePerson = async (id: string) => {
        if (!activeProjectId || !ok()) return;
        await storage.deletePerson(activeProjectId, id);
    };
    const updatePerson = async (person: Person) => {
        if (!activeProjectId || !ok()) return;
        await storage.savePerson(activeProjectId, person);
    };
    const reorderPeople = async (newOrder: Person[]) => {
        if (!activeProjectId || !ok()) return;
        dispatch({ type: 'SET_PEOPLE', payload: newOrder });
        const peopleWithOrder = newOrder.map((person, index) => ({ ...person, order: index }));
        await storage.updatePersonOrders(activeProjectId, peopleWithOrder);
    };

    const refresh = useCallback(() => {
        console.log("Refresh called, but store is real-time now.");
    }, []);

    return (
        <StoreContext.Provider value={{
            locations, scenes, characters, schedules, assets, people, settings,
            addLocation, deleteLocation, replaceLocations, reorderLocations,
            addScene, deleteScene, replaceScenes, reorderScenes,
            addShotToScene, deleteShotFromScene, updateShotInScene, reorderShotsInScene,
            addCharacter, deleteCharacter, updateCharacter, replaceCharacters, reorderCharacters,
            updateSettings,
            addSchedule, deleteSchedule, updateSchedule,
            addAsset, deleteAsset, updateAsset, reorderAssets,
            addPerson, deletePerson, updatePerson, reorderPeople,
            refresh,
        }}>
            {children}
        </StoreContext.Provider>
    );
};
