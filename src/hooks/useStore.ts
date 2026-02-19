import { useState, useEffect } from 'react';
import type { Location, Scene, Shot, Settings, Character } from '../types/types';
import { storage } from '../services/storage';
import { useAuth } from '../context/AuthContext';
import { useProjects } from '../context/ProjectContext';

const DEFAULT_SETTINGS: Settings = {
    aspectRatio: '16:9',
    useRandomSeed: true
};

export const useStore = () => {
    const { user } = useAuth();
    const { activeProjectId } = useProjects();
    const [locations, setLocations] = useState<Location[]>([]);
    const [scenes, setScenes] = useState<Scene[]>([]);
    const [characters, setCharacters] = useState<Character[]>([]);
    const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

    useEffect(() => {
        if (!user || !activeProjectId) {
            setLocations([]);
            setScenes([]);
            setCharacters([]);
            setSettings(DEFAULT_SETTINGS);
            return;
        }

        const unsubLocations = storage.subscribeToLocations(user.uid, activeProjectId, setLocations);
        const unsubScenes = storage.subscribeToScenes(user.uid, activeProjectId, setScenes);
        const unsubCharacters = storage.subscribeToCharacters(user.uid, activeProjectId, setCharacters);
        const unsubSettings = storage.subscribeToSettings(user.uid, (data) => {
            if (data) {
                setSettings(data);
            } else {
                setSettings(DEFAULT_SETTINGS);
            }
        });

        return () => {
            unsubLocations();
            unsubScenes();
            unsubCharacters();
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
        setLocations(newOrder);
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
        setScenes(newOrder);
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

        // Optimistic update if we want, but local state in UI handles drag visually. 
        // We might want to update store state too for consistency if we don't refetch immediately.
        // Actually since we subscribe to scenes, we should wait for Firestore or update optimistic.
        // For simplicity and speed in UI, we often rely on local state during drag, and commit on end.

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
        setCharacters(newOrder);

        // Update orders in storage
        // We need to ensure the validation of 'order' property
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

    const refresh = () => {
        // No-op or maybe re-fetch if needed, but subscriptions handle it.
        // Keeping it for interface compatibility if needed, but it's largely deprecated.
        console.log("Refresh called, but store is real-time now.");
    };

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
        refresh,
    };
};
