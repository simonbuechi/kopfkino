import { useReducer, useEffect, useCallback, useMemo } from 'react';
import type { Location, Scene, Shot, Person, Schedule, Asset, Character, Settings, Script } from '../types/types';
import { storage } from '../services/storage';
import { useAuth } from '../hooks/useAuth';
import { useProjects } from '../hooks/useProjects';
import { StoreContext } from './StoreContextObject';
import { storeReducer, storeInitialState, DEFAULT_SETTINGS } from './reducers';
import { canWrite, PERMISSION_DENIED_MSG } from '../utils/writeGuard';
import toast from 'react-hot-toast';

export const StoreProvider = ({ children }: { children: React.ReactNode }) => {
    const { user } = useAuth();
    const { activeProjectId, activeProjectRole } = useProjects();
    const [state, dispatch] = useReducer(storeReducer, storeInitialState);

    const { locations, scenes, characters, schedules, assets, people, settings, script } = state;

    const canUserWrite = canWrite(activeProjectId, activeProjectRole);

    const guardedWrite = useCallback(
        async (fn: (projectId: string) => Promise<void>): Promise<void> => {
            if (!activeProjectId) return;
            if (!canUserWrite) { toast.error(PERMISSION_DENIED_MSG); return; }
            await fn(activeProjectId);
        },
        [activeProjectId, canUserWrite]
    );

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
        await guardedWrite(id => storage.saveLocation(id, loc));
    }, [guardedWrite]);

    const deleteLocation = useCallback(async (locId: string) => {
        await guardedWrite(id => storage.deleteLocation(id, locId));
    }, [guardedWrite]);

    const replaceLocations = useCallback(async (newLocations: Location[]) => {
        await guardedWrite(id => storage.replaceAllLocations(id, newLocations));
    }, [guardedWrite]);

    const reorderLocations = useCallback(async (newOrder: Location[]) => {
        await guardedWrite(id => {
            dispatch({ type: 'SET_LOCATIONS', payload: newOrder });
            const locationsWithOrder = newOrder.map((loc, index) => ({ ...loc, order: index }));
            return storage.updateLocationOrders(id, locationsWithOrder);
        });
    }, [guardedWrite]);

    // Scenes
    const addScene = useCallback(async (scene: Scene) => {
        await guardedWrite(id => storage.saveScene(id, scene));
    }, [guardedWrite]);

    const deleteScene = useCallback(async (sceneId: string) => {
        await guardedWrite(id => storage.deleteScene(id, sceneId));
    }, [guardedWrite]);

    const replaceScenes = useCallback(async (newScenes: Scene[]) => {
        await guardedWrite(id => storage.replaceAllScenes(id, newScenes));
    }, [guardedWrite]);

    const reorderScenes = useCallback(async (newOrder: Scene[]) => {
        await guardedWrite(id => {
            dispatch({ type: 'SET_SCENES', payload: newOrder });
            const scenesWithOrder = newOrder.map((scene, index) => ({ ...scene, order: index }));
            return storage.updateSceneOrders(id, scenesWithOrder);
        });
    }, [guardedWrite]);

    // Shots — embedded in Scenes
    const addShotToScene = useCallback(async (sceneId: string, shot: Shot) => {
        await guardedWrite(id => {
            const scene = scenes.find(s => s.id === sceneId);
            if (!scene) return Promise.resolve();
            return storage.saveScene(id, { ...scene, shots: [...(scene.shots || []), shot] });
        });
    }, [guardedWrite, scenes]);

    const deleteShotFromScene = useCallback(async (sceneId: string, shotId: string) => {
        await guardedWrite(id => {
            const scene = scenes.find(s => s.id === sceneId);
            if (!scene?.shots) return Promise.resolve();
            return storage.saveScene(id, { ...scene, shots: scene.shots.filter(s => s.id !== shotId) });
        });
    }, [guardedWrite, scenes]);

    const updateShotInScene = useCallback(async (sceneId: string, shot: Shot) => {
        await guardedWrite(id => {
            const scene = scenes.find(s => s.id === sceneId);
            if (!scene?.shots) return Promise.resolve();
            return storage.saveScene(id, { ...scene, shots: scene.shots.map(s => s.id === shot.id ? shot : s) });
        });
    }, [guardedWrite, scenes]);

    const reorderShotsInScene = useCallback(async (sceneId: string, newShots: Shot[]) => {
        await guardedWrite(id => {
            const scene = scenes.find(s => s.id === sceneId);
            if (!scene) return Promise.resolve();
            return storage.saveScene(id, { ...scene, shots: newShots });
        });
    }, [guardedWrite, scenes]);

    // Characters
    const addCharacter = useCallback(async (character: Character) => {
        await guardedWrite(id => storage.saveCharacter(id, character));
    }, [guardedWrite]);

    const deleteCharacter = useCallback(async (charId: string) => {
        await guardedWrite(id => storage.deleteCharacter(id, charId));
    }, [guardedWrite]);

    const updateCharacter = useCallback(async (character: Character) => {
        await guardedWrite(id => storage.saveCharacter(id, character));
    }, [guardedWrite]);

    const replaceCharacters = useCallback(async (newCharacters: Character[]) => {
        await guardedWrite(id => storage.replaceAllCharacters(id, newCharacters));
    }, [guardedWrite]);

    const reorderCharacters = useCallback(async (newOrder: Character[]) => {
        await guardedWrite(id => {
            dispatch({ type: 'SET_CHARACTERS', payload: newOrder });
            const charactersWithOrder = newOrder.map((char, index) => ({ ...char, order: index }));
            return storage.updateCharacterOrders(id, charactersWithOrder);
        });
    }, [guardedWrite]);

    // Settings (user-scoped, always writable)
    const updateSettings = useCallback(async (newSettings: Settings) => {
        if (!user) return;
        await storage.saveSettings(user.uid, newSettings);
    }, [user]);

    // Schedules
    const addSchedule = useCallback(async (schedule: Schedule) => {
        await guardedWrite(id => storage.saveSchedule(id, schedule));
    }, [guardedWrite]);

    const deleteSchedule = useCallback(async (scheduleId: string) => {
        await guardedWrite(id => storage.deleteSchedule(id, scheduleId));
    }, [guardedWrite]);

    const updateSchedule = useCallback(async (schedule: Schedule) => {
        await guardedWrite(id => storage.saveSchedule(id, schedule));
    }, [guardedWrite]);

    // Assets
    const addAsset = useCallback(async (asset: Asset) => {
        await guardedWrite(id => storage.saveAsset(id, asset));
    }, [guardedWrite]);

    const deleteAsset = useCallback(async (assetId: string) => {
        await guardedWrite(id => storage.deleteAsset(id, assetId));
    }, [guardedWrite]);

    const updateAsset = useCallback(async (asset: Asset) => {
        await guardedWrite(id => storage.saveAsset(id, asset));
    }, [guardedWrite]);

    const reorderAssets = useCallback(async (newOrder: Asset[]) => {
        await guardedWrite(id => {
            dispatch({ type: 'SET_ASSETS', payload: newOrder });
            const assetsWithOrder = newOrder.map((asset, index) => ({ ...asset, order: index }));
            return storage.updateAssetOrders(id, assetsWithOrder);
        });
    }, [guardedWrite]);

    // People
    const addPerson = useCallback(async (person: Person) => {
        await guardedWrite(id => storage.savePerson(id, person));
    }, [guardedWrite]);

    const deletePerson = useCallback(async (personId: string) => {
        await guardedWrite(id => storage.deletePerson(id, personId));
    }, [guardedWrite]);

    const updatePerson = useCallback(async (person: Person) => {
        await guardedWrite(id => storage.savePerson(id, person));
    }, [guardedWrite]);

    const reorderPeople = useCallback(async (newOrder: Person[]) => {
        await guardedWrite(id => {
            dispatch({ type: 'SET_PEOPLE', payload: newOrder });
            const peopleWithOrder = newOrder.map((person, index) => ({ ...person, order: index }));
            return storage.updatePersonOrders(id, peopleWithOrder);
        });
    }, [guardedWrite]);

    // Script
    const saveScript = useCallback(async (content: string) => {
        await guardedWrite(id => {
            const scriptData: Script = { projectId: id, content, updatedAt: Date.now() };
            return storage.saveScript(id, scriptData);
        });
    }, [guardedWrite]);

    const setScriptFrozen = useCallback(async (frozen: boolean) => {
        await guardedWrite(id => storage.setScriptFrozen(id, frozen));
    }, [guardedWrite]);

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
