import { useState, useEffect } from 'react';
import type { Location, Scene, Shot, Settings, Character } from '../types/types';
import { storage } from '../services/storage';
import { useAuth } from '../context/AuthContext';

const DEFAULT_SETTINGS: Settings = {
    aspectRatio: '16:9',
    useRandomSeed: true
};

export const useStore = () => {
    const { user } = useAuth();
    const [locations, setLocations] = useState<Location[]>([]);
    const [scenes, setScenes] = useState<Scene[]>([]);
    const [shots, setShots] = useState<Shot[]>([]);
    const [characters, setCharacters] = useState<Character[]>([]);
    const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

    useEffect(() => {
        if (!user) {
            setLocations([]);
            setScenes([]);
            setShots([]);
            setCharacters([]);
            setSettings(DEFAULT_SETTINGS);
            return;
        }

        const unsubLocations = storage.subscribeToLocations(user.uid, setLocations);
        const unsubScenes = storage.subscribeToScenes(user.uid, setScenes);
        const unsubShots = storage.subscribeToShots(user.uid, setShots);
        const unsubCharacters = storage.subscribeToCharacters(user.uid, setCharacters);
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
            unsubShots();
            unsubCharacters();
            unsubSettings();
        };
    }, [user]);

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

    // Shots
    const addShot = async (shot: Shot) => {
        if (!user) return;
        await storage.saveShot(user.uid, shot);
    };
    const deleteShot = async (id: string) => {
        if (!user) return;
        await storage.deleteShot(user.uid, id);
    };
    const updateShot = async (shot: Shot) => {
        if (!user) return;
        await storage.saveShot(user.uid, shot);
    };
    const replaceShots = async (newShots: Shot[]) => {
        if (!user) return;
        await storage.replaceAllShots(user.uid, newShots);
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
        shots,
        characters,
        settings,
        addLocation,
        deleteLocation,
        replaceLocations,
        reorderLocations,
        addScene,
        deleteScene,
        replaceScenes,
        addShot,
        deleteShot,
        replaceShots,
        updateShot,
        addCharacter,
        deleteCharacter,
        updateCharacter,
        replaceCharacters,
        reorderCharacters,
        updateSettings,
        refresh,
    };
};
