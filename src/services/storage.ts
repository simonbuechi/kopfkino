import {
    collection,
    doc,
    setDoc,
    deleteDoc,
    onSnapshot,
    query,
    writeBatch,
    where,
    getDocs
} from 'firebase/firestore';
import type { Unsubscribe } from 'firebase/firestore';
import { db } from './firebase';
import type { Location, Scene, Settings, Character, Project } from '../types/types';

const COLLECTIONS = {
    USERS: 'users',
    LOCATIONS: 'locations',
    SCENES: 'scenes',
    SHOTS: 'shots',
    CHARACTERS: 'characters',
    SETTINGS: 'settings', // Subcollection or doc logic
    PROJECTS: 'projects',
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
    subscribeToLocations: (userId: string, projectId: string, callback: (locations: Location[]) => void): Unsubscribe => {
        const q = query(
            getUserCollection(userId, COLLECTIONS.LOCATIONS),
            where('projectId', '==', projectId)
        );
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
    subscribeToScenes: (userId: string, projectId: string, callback: (scenes: Scene[]) => void): Unsubscribe => {
        const q = query(
            getUserCollection(userId, COLLECTIONS.SCENES),
            where('projectId', '==', projectId)
        );
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
    subscribeToCharacters: (userId: string, projectId: string, callback: (characters: Character[]) => void): Unsubscribe => {
        const q = query(
            getUserCollection(userId, COLLECTIONS.CHARACTERS),
            where('projectId', '==', projectId)
        );
        return onSnapshot(q, (snapshot) => {
            const characters = snapshot.docs.map(doc => doc.data() as Character);
            characters.sort((a, b) => {
                const orderA = a.order ?? Number.MAX_SAFE_INTEGER;
                const orderB = b.order ?? Number.MAX_SAFE_INTEGER;
                return orderA - orderB;
            });
            callback(characters);
        });
    },

    updateCharacterOrders: async (userId: string, characters: Character[]) => {
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
        for (const char of characters) {
            await storage.saveCharacter(userId, char);
        }
    },

    // Projects
    subscribeToProjects: (userId: string, callback: (projects: Project[]) => void): Unsubscribe => {
        const q = query(getUserCollection(userId, COLLECTIONS.PROJECTS));
        return onSnapshot(q, (snapshot) => {
            const projects = snapshot.docs.map(doc => doc.data() as Project);
            // Sort by createdAt desc
            projects.sort((a, b) => b.createdAt - a.createdAt);
            callback(projects);
        });
    },

    saveProject: async (userId: string, project: Project) => {
        const docRef = doc(db, COLLECTIONS.USERS, userId, COLLECTIONS.PROJECTS, project.id);
        await setDoc(docRef, project);
    },

    deleteProject: async (userId: string, projectId: string) => {
        const docRef = doc(db, COLLECTIONS.USERS, userId, COLLECTIONS.PROJECTS, projectId);
        await deleteDoc(docRef);
    },

    // Migration
    migrateLegacyData: async (userId: string, targetProjectId: string) => {
        const batch = writeBatch(db);

        // Locations
        const locsSnapshot = await getDocs(getUserCollection(userId, COLLECTIONS.LOCATIONS));
        locsSnapshot.docs.forEach(doc => {
            const data = doc.data();
            if (!data.projectId) {
                batch.update(doc.ref, { projectId: targetProjectId });
            }
        });

        // Scenes
        const scenesSnapshot = await getDocs(getUserCollection(userId, COLLECTIONS.SCENES));
        scenesSnapshot.docs.forEach(doc => {
            const data = doc.data();
            if (!data.projectId) {
                batch.update(doc.ref, { projectId: targetProjectId });
            }
        });

        // Characters
        const charsSnapshot = await getDocs(getUserCollection(userId, COLLECTIONS.CHARACTERS));
        charsSnapshot.docs.forEach(doc => {
            const data = doc.data();
            if (!data.projectId) {
                batch.update(doc.ref, { projectId: targetProjectId });
            }
        });

        await batch.commit();
    },
    // Stats
    getAllProjectStats: async (userId: string) => {
        const stats: Record<string, { locations: number; scenes: number; shots: number; characters: number; length: number }> = {};

        const locsSnapshot = await getDocs(getUserCollection(userId, COLLECTIONS.LOCATIONS));
        locsSnapshot.docs.forEach(doc => {
            const data = doc.data() as Location;
            if (data.projectId) {
                if (!stats[data.projectId]) stats[data.projectId] = { locations: 0, scenes: 0, shots: 0, characters: 0, length: 0 };
                stats[data.projectId].locations++;
            }
        });

        const charsSnapshot = await getDocs(getUserCollection(userId, COLLECTIONS.CHARACTERS));
        charsSnapshot.docs.forEach(doc => {
            const data = doc.data() as Character;
            if (data.projectId) {
                if (!stats[data.projectId]) stats[data.projectId] = { locations: 0, scenes: 0, shots: 0, characters: 0, length: 0 };
                stats[data.projectId].characters++;
            }
        });

        const scenesSnapshot = await getDocs(getUserCollection(userId, COLLECTIONS.SCENES));
        scenesSnapshot.docs.forEach(doc => {
            const data = doc.data() as Scene;
            if (data.projectId) {
                if (!stats[data.projectId]) stats[data.projectId] = { locations: 0, scenes: 0, shots: 0, characters: 0, length: 0 };
                stats[data.projectId].scenes++;

                if (data.shots) {
                    stats[data.projectId].shots += data.shots.length;
                    // Calculate length
                    const sceneLength = data.shots.reduce((acc, shot) => acc + (shot.length || 0), 0);
                    stats[data.projectId].length += sceneLength;
                }
            }
        });

        return stats;
    }
};
