import { useReducer, useEffect, useCallback, useMemo } from 'react';
import type { Location, Scene, Shot, Person, Schedule, Asset, Character, Settings, Script } from '../types/types';
import { storage } from '../services/storage';
import { useAuth } from '../hooks/useAuth';
import { useProjects } from '../hooks/useProjects';
import { StoreContext } from './StoreContextObject';
import { storeReducer, storeInitialState, DEFAULT_SETTINGS } from './reducers';
import { canWrite } from '../utils/writeGuard';
import toast from 'react-hot-toast';

export const StoreProvider = ({ children }: { children: React.ReactNode }) => {
    const { user } = useAuth();
    const { activeProjectId, activeProjectRole } = useProjects();
    const [state, dispatch] = useReducer(storeReducer, storeInitialState);

    const { locations, scenes, characters, schedules, assets, people, settings, script } = state;

    const canUserWrite = canWrite(activeProjectId, activeProjectRole);

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
        const unsubScript = storage.subscribeToScript(activeProjectId, (payload) => dispatch({ type: 'SET_SCRIPT', payload }));

        return () => {
            unsubLocations();
            unsubScenes();
            unsubCharacters();
            unsubSchedules();
            unsubAssets();
            unsubPeople();
            unsubSettings();
            unsubScript();
        };
    }, [user, activeProjectId]);

    // Locations
    const saveLocation = useCallback(async (loc: Location) => {
        if (!activeProjectId) return;
        if (!canUserWrite) { toast.error('You don\'t have permission to edit this project.'); return; }
        await storage.saveLocation(activeProjectId, loc);
    }, [activeProjectId, canUserWrite]);

    const deleteLocation = useCallback(async (id: string) => {
        if (!activeProjectId) return;
        if (!canUserWrite) { toast.error('You don\'t have permission to edit this project.'); return; }
        await storage.deleteLocation(activeProjectId, id);
    }, [activeProjectId, canUserWrite]);

    const replaceLocations = useCallback(async (newLocations: Location[]) => {
        if (!activeProjectId) return;
        if (!canUserWrite) { toast.error('You don\'t have permission to edit this project.'); return; }
        await storage.replaceAllLocations(activeProjectId, newLocations);
    }, [activeProjectId, canUserWrite]);

    const reorderLocations = useCallback(async (newOrder: Location[]) => {
        if (!activeProjectId) return;
        if (!canUserWrite) { toast.error('You don\'t have permission to edit this project.'); return; }
        dispatch({ type: 'SET_LOCATIONS', payload: newOrder });
        const locationsWithOrder = newOrder.map((loc, index) => ({ ...loc, order: index }));
        await storage.updateLocationOrders(activeProjectId, locationsWithOrder);
    }, [activeProjectId, canUserWrite]);

    // Scenes
    const addScene = useCallback(async (scene: Scene) => {
        if (!activeProjectId) return;
        if (!canUserWrite) { toast.error('You don\'t have permission to edit this project.'); return; }
        await storage.saveScene(activeProjectId, scene);
    }, [activeProjectId, canUserWrite]);

    const deleteScene = useCallback(async (id: string) => {
        if (!activeProjectId) return;
        if (!canUserWrite) { toast.error('You don\'t have permission to edit this project.'); return; }
        await storage.deleteScene(activeProjectId, id);
    }, [activeProjectId, canUserWrite]);

    const replaceScenes = useCallback(async (newScenes: Scene[]) => {
        if (!activeProjectId) return;
        if (!canUserWrite) { toast.error('You don\'t have permission to edit this project.'); return; }
        await storage.replaceAllScenes(activeProjectId, newScenes);
    }, [activeProjectId, canUserWrite]);

    const reorderScenes = useCallback(async (newOrder: Scene[]) => {
        if (!activeProjectId) return;
        if (!canUserWrite) { toast.error('You don\'t have permission to edit this project.'); return; }
        dispatch({ type: 'SET_SCENES', payload: newOrder });
        const scenesWithOrder = newOrder.map((scene, index) => ({ ...scene, order: index }));
        await storage.updateSceneOrders(activeProjectId, scenesWithOrder);
    }, [activeProjectId, canUserWrite]);

    // Shots — embedded in Scenes
    const addShotToScene = useCallback(async (sceneId: string, shot: Shot) => {
        if (!activeProjectId) return;
        if (!canUserWrite) { toast.error('You don\'t have permission to edit this project.'); return; }
        const scene = scenes.find(s => s.id === sceneId);
        if (!scene) return;
        const updatedScene = { ...scene, shots: [...(scene.shots || []), shot] };
        await storage.saveScene(activeProjectId, updatedScene);
    }, [activeProjectId, canUserWrite, scenes]);

    const deleteShotFromScene = useCallback(async (sceneId: string, shotId: string) => {
        if (!activeProjectId) return;
        if (!canUserWrite) { toast.error('You don\'t have permission to edit this project.'); return; }
        const scene = scenes.find(s => s.id === sceneId);
        if (!scene?.shots) return;
        const updatedScene = { ...scene, shots: scene.shots.filter(s => s.id !== shotId) };
        await storage.saveScene(activeProjectId, updatedScene);
    }, [activeProjectId, canUserWrite, scenes]);

    const updateShotInScene = useCallback(async (sceneId: string, shot: Shot) => {
        if (!activeProjectId) return;
        if (!canUserWrite) { toast.error('You don\'t have permission to edit this project.'); return; }
        const scene = scenes.find(s => s.id === sceneId);
        if (!scene?.shots) return;
        const updatedScene = { ...scene, shots: scene.shots.map(s => s.id === shot.id ? shot : s) };
        await storage.saveScene(activeProjectId, updatedScene);
    }, [activeProjectId, canUserWrite, scenes]);

    const reorderShotsInScene = useCallback(async (sceneId: string, newShots: Shot[]) => {
        if (!activeProjectId) return;
        if (!canUserWrite) { toast.error('You don\'t have permission to edit this project.'); return; }
        const scene = scenes.find(s => s.id === sceneId);
        if (!scene) return;
        await storage.saveScene(activeProjectId, { ...scene, shots: newShots });
    }, [activeProjectId, canUserWrite, scenes]);

    // Characters
    const addCharacter = useCallback(async (character: Character) => {
        if (!activeProjectId) return;
        if (!canUserWrite) { toast.error('You don\'t have permission to edit this project.'); return; }
        await storage.saveCharacter(activeProjectId, character);
    }, [activeProjectId, canUserWrite]);

    const deleteCharacter = useCallback(async (id: string) => {
        if (!activeProjectId) return;
        if (!canUserWrite) { toast.error('You don\'t have permission to edit this project.'); return; }
        await storage.deleteCharacter(activeProjectId, id);
    }, [activeProjectId, canUserWrite]);

    const updateCharacter = useCallback(async (character: Character) => {
        if (!activeProjectId) return;
        if (!canUserWrite) { toast.error('You don\'t have permission to edit this project.'); return; }
        await storage.saveCharacter(activeProjectId, character);
    }, [activeProjectId, canUserWrite]);

    const replaceCharacters = useCallback(async (newCharacters: Character[]) => {
        if (!activeProjectId) return;
        if (!canUserWrite) { toast.error('You don\'t have permission to edit this project.'); return; }
        await storage.replaceAllCharacters(activeProjectId, newCharacters);
    }, [activeProjectId, canUserWrite]);

    const reorderCharacters = useCallback(async (newOrder: Character[]) => {
        if (!activeProjectId) return;
        if (!canUserWrite) { toast.error('You don\'t have permission to edit this project.'); return; }
        dispatch({ type: 'SET_CHARACTERS', payload: newOrder });
        const charactersWithOrder = newOrder.map((char, index) => ({ ...char, order: index }));
        await storage.updateCharacterOrders(activeProjectId, charactersWithOrder);
    }, [activeProjectId, canUserWrite]);

    // Settings (user-scoped, always writable)
    const updateSettings = useCallback(async (newSettings: Settings) => {
        if (!user) return;
        await storage.saveSettings(user.uid, newSettings);
    }, [user]);

    // Schedules
    const addSchedule = useCallback(async (schedule: Schedule) => {
        if (!activeProjectId) return;
        if (!canUserWrite) { toast.error('You don\'t have permission to edit this project.'); return; }
        await storage.saveSchedule(activeProjectId, schedule);
    }, [activeProjectId, canUserWrite]);

    const deleteSchedule = useCallback(async (id: string) => {
        if (!activeProjectId) return;
        if (!canUserWrite) { toast.error('You don\'t have permission to edit this project.'); return; }
        await storage.deleteSchedule(activeProjectId, id);
    }, [activeProjectId, canUserWrite]);

    const updateSchedule = useCallback(async (schedule: Schedule) => {
        if (!activeProjectId) return;
        if (!canUserWrite) { toast.error('You don\'t have permission to edit this project.'); return; }
        await storage.saveSchedule(activeProjectId, schedule);
    }, [activeProjectId, canUserWrite]);

    // Assets
    const addAsset = useCallback(async (asset: Asset) => {
        if (!activeProjectId) return;
        if (!canUserWrite) { toast.error('You don\'t have permission to edit this project.'); return; }
        await storage.saveAsset(activeProjectId, asset);
    }, [activeProjectId, canUserWrite]);

    const deleteAsset = useCallback(async (id: string) => {
        if (!activeProjectId) return;
        if (!canUserWrite) { toast.error('You don\'t have permission to edit this project.'); return; }
        await storage.deleteAsset(activeProjectId, id);
    }, [activeProjectId, canUserWrite]);

    const updateAsset = useCallback(async (asset: Asset) => {
        if (!activeProjectId) return;
        if (!canUserWrite) { toast.error('You don\'t have permission to edit this project.'); return; }
        await storage.saveAsset(activeProjectId, asset);
    }, [activeProjectId, canUserWrite]);

    const reorderAssets = useCallback(async (newOrder: Asset[]) => {
        if (!activeProjectId) return;
        if (!canUserWrite) { toast.error('You don\'t have permission to edit this project.'); return; }
        dispatch({ type: 'SET_ASSETS', payload: newOrder });
        const assetsWithOrder = newOrder.map((asset, index) => ({ ...asset, order: index }));
        await storage.updateAssetOrders(activeProjectId, assetsWithOrder);
    }, [activeProjectId, canUserWrite]);

    // People
    const addPerson = useCallback(async (person: Person) => {
        if (!activeProjectId) return;
        if (!canUserWrite) { toast.error('You don\'t have permission to edit this project.'); return; }
        await storage.savePerson(activeProjectId, person);
    }, [activeProjectId, canUserWrite]);

    const deletePerson = useCallback(async (id: string) => {
        if (!activeProjectId) return;
        if (!canUserWrite) { toast.error('You don\'t have permission to edit this project.'); return; }
        await storage.deletePerson(activeProjectId, id);
    }, [activeProjectId, canUserWrite]);

    const updatePerson = useCallback(async (person: Person) => {
        if (!activeProjectId) return;
        if (!canUserWrite) { toast.error('You don\'t have permission to edit this project.'); return; }
        await storage.savePerson(activeProjectId, person);
    }, [activeProjectId, canUserWrite]);

    const reorderPeople = useCallback(async (newOrder: Person[]) => {
        if (!activeProjectId) return;
        if (!canUserWrite) { toast.error('You don\'t have permission to edit this project.'); return; }
        dispatch({ type: 'SET_PEOPLE', payload: newOrder });
        const peopleWithOrder = newOrder.map((person, index) => ({ ...person, order: index }));
        await storage.updatePersonOrders(activeProjectId, peopleWithOrder);
    }, [activeProjectId, canUserWrite]);

    // Script
    const saveScript = useCallback(async (content: string) => {
        if (!activeProjectId) return;
        if (!canUserWrite) { toast.error('You don\'t have permission to edit this project.'); return; }
        const scriptData: Script = { projectId: activeProjectId, content, updatedAt: Date.now() };
        await storage.saveScript(activeProjectId, scriptData);
    }, [activeProjectId, canUserWrite]);

    const setScriptFrozen = useCallback(async (frozen: boolean) => {
        if (!activeProjectId) return;
        if (!canUserWrite) { toast.error('You don\'t have permission to edit this project.'); return; }
        await storage.setScriptFrozen(activeProjectId, frozen);
    }, [activeProjectId, canUserWrite]);

    const contextValue = useMemo(() => ({
        locations, scenes, characters, schedules, assets, people, settings, script,
        saveLocation, deleteLocation, replaceLocations, reorderLocations,
        addScene, deleteScene, replaceScenes, reorderScenes,
        addShotToScene, deleteShotFromScene, updateShotInScene, reorderShotsInScene,
        addCharacter, deleteCharacter, updateCharacter, replaceCharacters, reorderCharacters,
        updateSettings,
        addSchedule, deleteSchedule, updateSchedule,
        addAsset, deleteAsset, updateAsset, reorderAssets,
        addPerson, deletePerson, updatePerson, reorderPeople,
        saveScript, setScriptFrozen,
    }), [
        locations, scenes, characters, schedules, assets, people, settings, script,
        saveLocation, deleteLocation, replaceLocations, reorderLocations,
        addScene, deleteScene, replaceScenes, reorderScenes,
        addShotToScene, deleteShotFromScene, updateShotInScene, reorderShotsInScene,
        addCharacter, deleteCharacter, updateCharacter, replaceCharacters, reorderCharacters,
        updateSettings,
        addSchedule, deleteSchedule, updateSchedule,
        addAsset, deleteAsset, updateAsset, reorderAssets,
        addPerson, deletePerson, updatePerson, reorderPeople,
        saveScript, setScriptFrozen,
    ]);

    return (
        <StoreContext.Provider value={contextValue}>
            {children}
        </StoreContext.Provider>
    );
};
