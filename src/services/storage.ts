import {
    collection,
    doc,
    setDoc,
    deleteDoc,
    onSnapshot,
    query,
    writeBatch
} from 'firebase/firestore';
import type { Unsubscribe } from 'firebase/firestore';
import { db } from './firebase';
import type { Location, Scene, Settings, Character } from '../types/types';

const COLLECTIONS = {
    USERS: 'users',
    LOCATIONS: 'locations',
    SCENES: 'scenes',
    SHOTS: 'shots',
    CHARACTERS: 'characters',
    SETTINGS: 'settings', // Subcollection or doc logic
};

// Helper for single document settings
const getSettingsDoc = (userId: string) => {
    return doc(db, COLLECTIONS.USERS, userId, COLLECTIONS.SETTINGS, 'general');
};

// Helper to get user subcollection references
const getUserCollection = (userId: string, collectionName: string) => {
    return collection(db, COLLECTIONS.USERS, userId, collectionName);
};

export const storage = {
    // Locations
    subscribeToLocations: (userId: string, callback: (locations: Location[]) => void): Unsubscribe => {
        const q = query(getUserCollection(userId, COLLECTIONS.LOCATIONS));
        return onSnapshot(q, (snapshot) => {
            const locations = snapshot.docs.map(doc => doc.data() as Location);
            locations.sort((a, b) => {
                const orderA = a.order ?? Number.MAX_SAFE_INTEGER;
                const orderB = b.order ?? Number.MAX_SAFE_INTEGER;
                return orderA - orderB;
            });
            callback(locations);
        });
    },

    updateLocationOrders: async (userId: string, locations: Location[]) => {
        const batch = writeBatch(db);
        locations.forEach((loc) => {
            const docRef = doc(db, COLLECTIONS.USERS, userId, COLLECTIONS.LOCATIONS, loc.id);
            batch.update(docRef, { order: loc.order });
        });
        await batch.commit();
    },

    saveLocation: async (userId: string, location: Location) => {
        const docRef = doc(db, COLLECTIONS.USERS, userId, COLLECTIONS.LOCATIONS, location.id);
        await setDoc(docRef, location);
    },

    deleteLocation: async (userId: string, locationId: string) => {
        const docRef = doc(db, COLLECTIONS.USERS, userId, COLLECTIONS.LOCATIONS, locationId);
        await deleteDoc(docRef);
    },

    // Scenes
    subscribeToScenes: (userId: string, callback: (scenes: Scene[]) => void): Unsubscribe => {
        const q = query(getUserCollection(userId, COLLECTIONS.SCENES));
        return onSnapshot(q, (snapshot) => {
            const scenes = snapshot.docs.map(doc => doc.data() as Scene);
            scenes.sort((a, b) => {
                const orderA = a.order ?? Number.MAX_SAFE_INTEGER;
                const orderB = b.order ?? Number.MAX_SAFE_INTEGER;
                return orderA - orderB;
            });
            callback(scenes);
        });
    },

    updateSceneOrders: async (userId: string, scenes: Scene[]) => {
        const batch = writeBatch(db);
        scenes.forEach((scene) => {
            const docRef = doc(db, COLLECTIONS.USERS, userId, COLLECTIONS.SCENES, scene.id);
            batch.update(docRef, { order: scene.order });
        });
        await batch.commit();
    },

    saveScene: async (userId: string, scene: Scene) => {
        const docRef = doc(db, COLLECTIONS.USERS, userId, COLLECTIONS.SCENES, scene.id);
        await setDoc(docRef, scene);
    },

    deleteScene: async (userId: string, sceneId: string) => {
        const docRef = doc(db, COLLECTIONS.USERS, userId, COLLECTIONS.SCENES, sceneId);
        await deleteDoc(docRef);
    },

    // Shots - Embedded in Scenes now, so no separate collection logic needed here.
    // If we wanted to migrate old shots, we'd need a one-time script, but for now we assume they are gone or handled elsewhere.

    // Settings
    subscribeToSettings: (userId: string, callback: (settings: Settings | null) => void): Unsubscribe => {
        const docRef = getSettingsDoc(userId);
        return onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                callback(docSnap.data() as Settings);
            } else {
                callback(null);
            }
        });
    },

    saveSettings: async (userId: string, settings: Settings) => {
        const docRef = getSettingsDoc(userId);
        await setDoc(docRef, settings);
    },

    // Batch replacements
    replaceAllLocations: async (userId: string, locations: Location[]) => {
        for (const loc of locations) {
            await storage.saveLocation(userId, loc);
        }
    },

    replaceAllScenes: async (userId: string, scenes: Scene[]) => {
        for (const scene of scenes) {
            await storage.saveScene(userId, scene);
        }
    },

    // Characters
    subscribeToCharacters: (userId: string, callback: (characters: Character[]) => void): Unsubscribe => {
        const q = query(getUserCollection(userId, COLLECTIONS.CHARACTERS));
        return onSnapshot(q, (snapshot) => {
            const characters = snapshot.docs.map(doc => doc.data() as Character);
            // Sort by order if available, otherwise fallback to creation time natural order
            // Since we don't have creation time explicitly yet, maybe name? or just keep random.
            // Let's sort by order, treating undefined as Infinity (or 0 if we want them at top). 
            // Typically new items might not have order. We should probably assign them one.
            // For now:
            characters.sort((a, b) => {
                const orderA = a.order ?? Number.MAX_SAFE_INTEGER;
                const orderB = b.order ?? Number.MAX_SAFE_INTEGER;
                return orderA - orderB;
            });
            callback(characters);
        });
    },

    updateCharacterOrders: async (userId: string, characters: Character[]) => {
        // We could use a batch here for efficiency
        const batch = writeBatch(db);
        characters.forEach((char) => {
            const docRef = doc(db, COLLECTIONS.USERS, userId, COLLECTIONS.CHARACTERS, char.id);
            batch.update(docRef, { order: char.order });
        });
        await batch.commit();
    },

    saveCharacter: async (userId: string, character: Character) => {
        const docRef = doc(db, COLLECTIONS.USERS, userId, COLLECTIONS.CHARACTERS, character.id);
        await setDoc(docRef, character);
    },

    deleteCharacter: async (userId: string, characterId: string) => {
        const docRef = doc(db, COLLECTIONS.USERS, userId, COLLECTIONS.CHARACTERS, characterId);
        await deleteDoc(docRef);
    },

    replaceAllCharacters: async (userId: string, characters: Character[]) => {
        // Simple loop implementation as per other replace methods
        for (const char of characters) {
            await storage.saveCharacter(userId, char);
        }
    }
};
