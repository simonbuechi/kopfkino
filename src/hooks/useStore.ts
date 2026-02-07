import { useState, useEffect } from 'react';
import type { Location, Scene, Shot, Settings } from '../types/types';
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
    const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

    useEffect(() => {
        if (!user) {
            setLocations([]);
            setScenes([]);
            setShots([]);
            setSettings(DEFAULT_SETTINGS);
            return;
        }

        const unsubLocations = storage.subscribeToLocations(user.uid, setLocations);
        const unsubScenes = storage.subscribeToScenes(user.uid, setScenes);
        const unsubShots = storage.subscribeToShots(user.uid, setShots);
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

    // Settings
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
        settings,
        addLocation,
        deleteLocation,
        replaceLocations,
        addScene,
        deleteScene,
        replaceScenes,
        addShot,
        deleteShot,
        replaceShots,
        updateShot,
        updateSettings,
        refresh,
    };
};
