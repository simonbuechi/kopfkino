import {
    collection,
    doc,
    setDoc,
    deleteDoc,
    onSnapshot,
    query,
    writeBatch,
    where,
    getDocs,
    getDoc,
    updateDoc,
} from 'firebase/firestore';
import type { Unsubscribe } from 'firebase/firestore';
import { db } from './firebase';
import type {
    Location, Scene, Settings, Character, Project, Schedule, Asset, Person,
    ProjectRole, ProjectMember, ProjectRef, Invitation,
} from '../types/types';
import type { User } from 'firebase/auth';
import { byOrder, byCreatedAtDesc, byUpdatedAtDesc } from '../utils/sort';

// ---------------------------------------------------------------------------
// Collection name constants
// ---------------------------------------------------------------------------
const COLLECTIONS = {
    PROJECTS: 'projects',
    LOCATIONS: 'locations',
    SCENES: 'scenes',
    CHARACTERS: 'characters',
    SETTINGS: 'settings',
    SCHEDULES: 'schedules',
    ASSETS: 'assets',
    PEOPLE: 'people',
    PROJECT_REFS: 'projectRefs',
    INVITATIONS: 'invitations',
    USERS: 'users',
};

// ---------------------------------------------------------------------------
// Path helpers
// ---------------------------------------------------------------------------

/** Resources live under projects/{projectId}/{collection} */
const getProjectCollection = (projectId: string, collectionName: string) =>
    collection(db, COLLECTIONS.PROJECTS, projectId, collectionName);

/** Settings and projectRefs live under users/{userId}/{collection} */
const getUserCollection = (userId: string, collectionName: string) =>
    collection(db, COLLECTIONS.USERS, userId, collectionName);

const getSettingsDoc = (userId: string) =>
    doc(db, COLLECTIONS.USERS, userId, COLLECTIONS.SETTINGS, 'general');

const getProjectRefDoc = (userId: string, projectId: string) =>
    doc(db, COLLECTIONS.USERS, userId, COLLECTIONS.PROJECT_REFS, projectId);

// ---------------------------------------------------------------------------
// Storage API
// ---------------------------------------------------------------------------
export const storage = {

    // -------------------------------------------------------------------------
    // Projects
    // -------------------------------------------------------------------------

    subscribeToProjects: (userId: string, callback: (projects: Project[]) => void): Unsubscribe => {
        // Subscribe to the user's projectRefs index, then fan-out to each project doc.
        const refsCollection = getUserCollection(userId, COLLECTIONS.PROJECT_REFS);
        const projectUnsubscribers = new Map<string, Unsubscribe>();
        const projectsMap = new Map<string, Project>();

        const notifyCallback = () => {
            const projects = Array.from(projectsMap.values()).sort(byCreatedAtDesc);
            callback(projects);
        };

        const refsUnsub = onSnapshot(query(refsCollection), (refsSnap) => {
            const currentIds = new Set(refsSnap.docs.map(d => d.id));

            // Remove listeners for projects that are no longer in refs
            for (const [id, unsub] of projectUnsubscribers) {
                if (!currentIds.has(id)) {
                    unsub();
                    projectUnsubscribers.delete(id);
                    projectsMap.delete(id);
                }
            }

            // Add listeners for new project refs
            for (const refDoc of refsSnap.docs) {
                const projectId = refDoc.id;
                if (!projectUnsubscribers.has(projectId)) {
                    const projectDocRef = doc(db, COLLECTIONS.PROJECTS, projectId);
                    const unsub = onSnapshot(projectDocRef, (projectSnap) => {
                        if (projectSnap.exists()) {
                            projectsMap.set(projectId, projectSnap.data() as Project);
                        } else {
                            projectsMap.delete(projectId);
                        }
                        notifyCallback();
                    });
                    projectUnsubscribers.set(projectId, unsub);
                }
            }

            // If refs are empty, notify immediately
            if (currentIds.size === 0) {
                notifyCallback();
            }
        });

        return () => {
            refsUnsub();
            for (const unsub of projectUnsubscribers.values()) {
                unsub();
            }
        };
    },

    saveProject: async (userId: string, project: Project) => {
        const projectDocRef = doc(db, COLLECTIONS.PROJECTS, project.id);
        await setDoc(projectDocRef, project);
        // Ensure the projectRef index entry exists for the owner
        const role = project.members[userId]?.role ?? 'owner';
        await setDoc(getProjectRefDoc(userId, project.id), { projectId: project.id, role } as ProjectRef);
    },

    deleteProject: async (userId: string, projectId: string) => {
        const projectDocRef = doc(db, COLLECTIONS.PROJECTS, projectId);
        await deleteDoc(projectDocRef);
        await deleteDoc(getProjectRefDoc(userId, projectId));
    },

    // -------------------------------------------------------------------------
    // Sharing & Members
    // -------------------------------------------------------------------------

    inviteToProject: async (
        projectId: string,
        inviterUserId: string,
        inviteeEmail: string,
        role: ProjectRole,
    ) => {
        const invitation: Invitation = {
            id: crypto.randomUUID(),
            email: inviteeEmail.toLowerCase().trim(),
            projectId,
            role,
            invitedBy: inviterUserId,
            createdAt: Date.now(),
            status: 'pending',
        };
        const invitationRef = doc(db, COLLECTIONS.INVITATIONS, invitation.id);
        await setDoc(invitationRef, invitation);
    },

    subscribeToInvitations: (email: string, callback: (invitations: Invitation[]) => void): Unsubscribe => {
        const q = query(
            collection(db, COLLECTIONS.INVITATIONS),
            where('email', '==', email.toLowerCase().trim()),
            where('status', '==', 'pending'),
        );
        return onSnapshot(q, (snap) => {
            callback(snap.docs.map(d => d.data() as Invitation));
        });
    },

    getPendingInvitationsForProject: async (projectId: string): Promise<Invitation[]> => {
        const q = query(
            collection(db, COLLECTIONS.INVITATIONS),
            where('projectId', '==', projectId),
            where('status', '==', 'pending'),
        );
        const snap = await getDocs(q);
        return snap.docs.map(d => d.data() as Invitation);
    },

    revokeInvitation: async (invitationId: string) => {
        await deleteDoc(doc(db, COLLECTIONS.INVITATIONS, invitationId));
    },

    acceptInvitation: async (invitation: Invitation, user: User) => {
        const projectDocRef = doc(db, COLLECTIONS.PROJECTS, invitation.projectId);
        const member: ProjectMember = {
            role: invitation.role,
            email: user.email ?? '',
            displayName: user.displayName ?? user.email ?? 'Unknown',
            addedAt: Date.now(),
        };
        // Add user to project members
        await updateDoc(projectDocRef, {
            [`members.${user.uid}`]: member,
        });
        // Add projectRef for the new member
        await setDoc(getProjectRefDoc(user.uid, invitation.projectId), {
            projectId: invitation.projectId,
            role: invitation.role,
        } as ProjectRef);
        // Mark invitation as accepted
        const invitationRef = doc(db, COLLECTIONS.INVITATIONS, invitation.id);
        await updateDoc(invitationRef, { status: 'accepted' });
    },

    updateMemberRole: async (projectId: string, targetUserId: string, role: ProjectRole) => {
        const projectDocRef = doc(db, COLLECTIONS.PROJECTS, projectId);
        await updateDoc(projectDocRef, { [`members.${targetUserId}.role`]: role });
        // Sync projectRef role
        await setDoc(getProjectRefDoc(targetUserId, projectId), { projectId, role } as ProjectRef, { merge: true });
    },

    removeMember: async (projectId: string, targetUserId: string) => {
        const projectDocRef = doc(db, COLLECTIONS.PROJECTS, projectId);
        // Remove the member map entry by setting it to deleteField() equivalent
        const projectSnap = await getDoc(projectDocRef);
        if (projectSnap.exists()) {
            const data = projectSnap.data() as Project;
            const members = { ...data.members };
            delete members[targetUserId];
            await updateDoc(projectDocRef, { members });
        }
        await deleteDoc(getProjectRefDoc(targetUserId, projectId));
    },

    transferOwnership: async (projectId: string, currentOwnerId: string, newOwnerId: string) => {
        const projectDocRef = doc(db, COLLECTIONS.PROJECTS, projectId);
        await updateDoc(projectDocRef, {
            ownerId: newOwnerId,
            [`members.${newOwnerId}.role`]: 'owner' as ProjectRole,
            [`members.${currentOwnerId}.role`]: 'editor' as ProjectRole,
        });
        await setDoc(getProjectRefDoc(newOwnerId, projectId), { projectId, role: 'owner' as ProjectRole }, { merge: true });
        await setDoc(getProjectRefDoc(currentOwnerId, projectId), { projectId, role: 'editor' as ProjectRole }, { merge: true });
    },

    // -------------------------------------------------------------------------
    // Locations
    // -------------------------------------------------------------------------

    subscribeToLocations: (projectId: string, callback: (locations: Location[]) => void): Unsubscribe => {
        return onSnapshot(query(getProjectCollection(projectId, COLLECTIONS.LOCATIONS)), (snapshot) => {
            const locations = snapshot.docs.map(d => d.data() as Location);
            locations.sort(byOrder);
            callback(locations);
        });
    },

    updateLocationOrders: async (projectId: string, locations: Location[]) => {
        const batch = writeBatch(db);
        locations.forEach((loc) => {
            batch.update(doc(db, COLLECTIONS.PROJECTS, projectId, COLLECTIONS.LOCATIONS, loc.id), { order: loc.order });
        });
        await batch.commit();
    },

    saveLocation: async (projectId: string, location: Location) => {
        const data = Object.fromEntries(
            Object.entries(location).filter(([, v]) => v !== undefined)
        ) as Location;
        await setDoc(doc(db, COLLECTIONS.PROJECTS, projectId, COLLECTIONS.LOCATIONS, data.id), data);
    },

    deleteLocation: async (projectId: string, locationId: string) => {
        await deleteDoc(doc(db, COLLECTIONS.PROJECTS, projectId, COLLECTIONS.LOCATIONS, locationId));
    },

    replaceAllLocations: async (projectId: string, locations: Location[]) => {
        for (const loc of locations) {
            await storage.saveLocation(projectId, loc);
        }
    },

    // -------------------------------------------------------------------------
    // Scenes
    // -------------------------------------------------------------------------

    subscribeToScenes: (projectId: string, callback: (scenes: Scene[]) => void): Unsubscribe => {
        return onSnapshot(query(getProjectCollection(projectId, COLLECTIONS.SCENES)), (snapshot) => {
            const scenes = snapshot.docs.map(d => d.data() as Scene);
            scenes.sort(byOrder);
            callback(scenes);
        });
    },

    updateSceneOrders: async (projectId: string, scenes: Scene[]) => {
        const batch = writeBatch(db);
        scenes.forEach((scene) => {
            batch.update(doc(db, COLLECTIONS.PROJECTS, projectId, COLLECTIONS.SCENES, scene.id), { order: scene.order });
        });
        await batch.commit();
    },

    saveScene: async (projectId: string, scene: Scene) => {
        await setDoc(doc(db, COLLECTIONS.PROJECTS, projectId, COLLECTIONS.SCENES, scene.id), scene);
    },

    deleteScene: async (projectId: string, sceneId: string) => {
        await deleteDoc(doc(db, COLLECTIONS.PROJECTS, projectId, COLLECTIONS.SCENES, sceneId));
    },

    replaceAllScenes: async (projectId: string, scenes: Scene[]) => {
        for (const scene of scenes) {
            await storage.saveScene(projectId, scene);
        }
    },

    // -------------------------------------------------------------------------
    // Characters
    // -------------------------------------------------------------------------

    subscribeToCharacters: (projectId: string, callback: (characters: Character[]) => void): Unsubscribe => {
        return onSnapshot(query(getProjectCollection(projectId, COLLECTIONS.CHARACTERS)), (snapshot) => {
            const characters = snapshot.docs.map(d => d.data() as Character);
            characters.sort(byOrder);
            callback(characters);
        });
    },

    updateCharacterOrders: async (projectId: string, characters: Character[]) => {
        const batch = writeBatch(db);
        characters.forEach((char) => {
            batch.update(doc(db, COLLECTIONS.PROJECTS, projectId, COLLECTIONS.CHARACTERS, char.id), { order: char.order });
        });
        await batch.commit();
    },

    saveCharacter: async (projectId: string, character: Character) => {
        await setDoc(doc(db, COLLECTIONS.PROJECTS, projectId, COLLECTIONS.CHARACTERS, character.id), character);
    },

    deleteCharacter: async (projectId: string, characterId: string) => {
        await deleteDoc(doc(db, COLLECTIONS.PROJECTS, projectId, COLLECTIONS.CHARACTERS, characterId));
    },

    replaceAllCharacters: async (projectId: string, characters: Character[]) => {
        for (const char of characters) {
            await storage.saveCharacter(projectId, char);
        }
    },

    // -------------------------------------------------------------------------
    // Schedules
    // -------------------------------------------------------------------------

    subscribeToSchedules: (projectId: string, callback: (schedules: Schedule[]) => void): Unsubscribe => {
        return onSnapshot(query(getProjectCollection(projectId, COLLECTIONS.SCHEDULES)), (snapshot) => {
            const schedules = snapshot.docs.map(d => d.data() as Schedule);
            schedules.sort(byUpdatedAtDesc);
            callback(schedules);
        });
    },

    saveSchedule: async (projectId: string, schedule: Schedule) => {
        await setDoc(doc(db, COLLECTIONS.PROJECTS, projectId, COLLECTIONS.SCHEDULES, schedule.id), schedule);
    },

    deleteSchedule: async (projectId: string, scheduleId: string) => {
        await deleteDoc(doc(db, COLLECTIONS.PROJECTS, projectId, COLLECTIONS.SCHEDULES, scheduleId));
    },

    // -------------------------------------------------------------------------
    // Assets
    // -------------------------------------------------------------------------

    subscribeToAssets: (projectId: string, callback: (assets: Asset[]) => void): Unsubscribe => {
        return onSnapshot(query(getProjectCollection(projectId, COLLECTIONS.ASSETS)), (snapshot) => {
            const assets = snapshot.docs.map(d => d.data() as Asset);
            assets.sort(byOrder);
            callback(assets);
        });
    },

    updateAssetOrders: async (projectId: string, assets: Asset[]) => {
        const batch = writeBatch(db);
        assets.forEach((asset) => {
            batch.update(doc(db, COLLECTIONS.PROJECTS, projectId, COLLECTIONS.ASSETS, asset.id), { order: asset.order });
        });
        await batch.commit();
    },

    saveAsset: async (projectId: string, asset: Asset) => {
        await setDoc(doc(db, COLLECTIONS.PROJECTS, projectId, COLLECTIONS.ASSETS, asset.id), asset);
    },

    deleteAsset: async (projectId: string, assetId: string) => {
        await deleteDoc(doc(db, COLLECTIONS.PROJECTS, projectId, COLLECTIONS.ASSETS, assetId));
    },

    // -------------------------------------------------------------------------
    // People
    // -------------------------------------------------------------------------

    subscribeToPeople: (projectId: string, callback: (people: Person[]) => void): Unsubscribe => {
        return onSnapshot(query(getProjectCollection(projectId, COLLECTIONS.PEOPLE)), (snapshot) => {
            const people = snapshot.docs.map(d => d.data() as Person);
            people.sort(byOrder);
            callback(people);
        });
    },

    updatePersonOrders: async (projectId: string, people: Person[]) => {
        const batch = writeBatch(db);
        people.forEach((person) => {
            batch.update(doc(db, COLLECTIONS.PROJECTS, projectId, COLLECTIONS.PEOPLE, person.id), { order: person.order });
        });
        await batch.commit();
    },

    savePerson: async (projectId: string, person: Person) => {
        await setDoc(doc(db, COLLECTIONS.PROJECTS, projectId, COLLECTIONS.PEOPLE, person.id), person);
    },

    deletePerson: async (projectId: string, personId: string) => {
        await deleteDoc(doc(db, COLLECTIONS.PROJECTS, projectId, COLLECTIONS.PEOPLE, personId));
    },

    // -------------------------------------------------------------------------
    // Settings (remain user-scoped)
    // -------------------------------------------------------------------------

    subscribeToSettings: (userId: string, callback: (settings: Settings | null) => void): Unsubscribe => {
        return onSnapshot(getSettingsDoc(userId), (docSnap) => {
            callback(docSnap.exists() ? (docSnap.data() as Settings) : null);
        });
    },

    saveSettings: async (userId: string, settings: Settings) => {
        await setDoc(getSettingsDoc(userId), settings);
    },

    // -------------------------------------------------------------------------
    // Stats (for project dashboard)
    // -------------------------------------------------------------------------

    getAllProjectStats: async (userId: string) => {
        const stats: Record<string, { locations: number; scenes: number; shots: number; characters: number; length: number }> = {};

        // Get all project refs for this user
        const refsSnap = await getDocs(getUserCollection(userId, COLLECTIONS.PROJECT_REFS));
        const projectIds = refsSnap.docs.map(d => d.id);

        for (const projectId of projectIds) {
            stats[projectId] = { locations: 0, scenes: 0, shots: 0, characters: 0, length: 0 };

            const locsSnap = await getDocs(getProjectCollection(projectId, COLLECTIONS.LOCATIONS));
            stats[projectId].locations = locsSnap.size;

            const charsSnap = await getDocs(getProjectCollection(projectId, COLLECTIONS.CHARACTERS));
            stats[projectId].characters = charsSnap.size;

            const scenesSnap = await getDocs(getProjectCollection(projectId, COLLECTIONS.SCENES));
            stats[projectId].scenes = scenesSnap.size;
            scenesSnap.docs.forEach(d => {
                const scene = d.data() as Scene;
                stats[projectId].shots += (scene.shots?.length ?? 0);
                stats[projectId].length += (scene.shots ?? []).reduce((acc, s) => acc + (s.length ?? 0), 0);
            });
        }

        return stats;
    },

};
