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
    getCountFromServer,
    updateDoc,
    deleteField,
} from 'firebase/firestore';
import type { Unsubscribe, WriteBatch } from 'firebase/firestore';
import { db } from './firebase';
import type {
    Location, Scene, Shot, ShotSetup as ShotGroup, Settings, Character, Project, Schedule, Asset, Person, Script, ScriptRevision,
    Act, Beat,
    ProjectRole, ProjectMember, ProjectRef, Invitation, KnowledgeItem, Plan, Task,
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
    SCRIPT: 'script',
    SCRIPT_REVISIONS: 'scriptRevisions',
    ACTS: 'scriptActs',
    BEATS: 'scriptBeats',
    PROJECT_REFS: 'projectRefs',
    INVITATIONS: 'invitations',
    USERS: 'users',
    KNOWLEDGE: 'knowledge',
    PLANS: 'plans',
    TASKS: 'tasks',
} as const;

const PROJECT_SUBCOLLECTIONS = [
    COLLECTIONS.LOCATIONS,
    COLLECTIONS.SCENES,
    COLLECTIONS.CHARACTERS,
    COLLECTIONS.SCHEDULES,
    COLLECTIONS.ASSETS,
    COLLECTIONS.PEOPLE,
    COLLECTIONS.SCRIPT,
    COLLECTIONS.SCRIPT_REVISIONS,
    COLLECTIONS.ACTS,
    COLLECTIONS.BEATS,
    COLLECTIONS.PLANS,
    COLLECTIONS.TASKS,
] as const;

const MAX_BATCH_SIZE = 450;

// ---------------------------------------------------------------------------
// Sanitization & Batch Helpers
// ---------------------------------------------------------------------------

/** Recursively strips `undefined` properties before writing to Firestore. */
export function sanitizeForFirestore<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
}

/** Executes an array of WriteBatch operations in chunks of at most 450 ops. */
async function commitChunkedOperations(operations: ((batch: WriteBatch) => void)[]): Promise<void> {
    if (operations.length === 0) return;
    for (let i = 0; i < operations.length; i += MAX_BATCH_SIZE) {
        const chunk = operations.slice(i, i + MAX_BATCH_SIZE);
        const batch = writeBatch(db);
        for (const op of chunk) {
            op(batch);
        }
        await batch.commit();
    }
}

// ---------------------------------------------------------------------------
// Path & Generic Project Collection Helpers
// ---------------------------------------------------------------------------

/** Resources live under projects/{projectId}/{collection} */
const getProjectCollection = (projectId: string, collectionName: string) =>
    collection(db, COLLECTIONS.PROJECTS, projectId, collectionName);

const getProjectDoc = (projectId: string, collectionName: string, itemId: string) =>
    doc(db, COLLECTIONS.PROJECTS, projectId, collectionName, itemId);

/** Settings and projectRefs live under users/{userId}/{collection} */
const getUserCollection = (userId: string, collectionName: string) =>
    collection(db, COLLECTIONS.USERS, userId, collectionName);

const getSettingsDoc = (userId: string) =>
    doc(db, COLLECTIONS.USERS, userId, COLLECTIONS.SETTINGS, 'general');

const getProjectRefDoc = (userId: string, projectId: string) =>
    doc(db, COLLECTIONS.USERS, userId, COLLECTIONS.PROJECT_REFS, projectId);

function subscribeProjectCollection<T>(
    projectId: string,
    collectionName: string,
    sorter: (a: T, b: T) => number,
    callback: (items: T[]) => void,
): Unsubscribe {
    return onSnapshot(query(getProjectCollection(projectId, collectionName)), (snapshot) => {
        const items = snapshot.docs.map(d => d.data() as T);
        items.sort(sorter);
        callback(items);
    });
}

async function saveProjectItem<T extends { id: string }>(
    projectId: string,
    collectionName: string,
    item: T,
): Promise<void> {
    const clean = sanitizeForFirestore(item);
    await setDoc(getProjectDoc(projectId, collectionName, clean.id), clean);
}

async function deleteProjectItem(
    projectId: string,
    collectionName: string,
    itemId: string,
): Promise<void> {
    await deleteDoc(getProjectDoc(projectId, collectionName, itemId));
}

async function updateProjectOrders<T extends { id: string; order?: number }>(
    projectId: string,
    collectionName: string,
    items: T[],
): Promise<void> {
    await commitChunkedOperations(
        items.map(item => (batch) => {
            batch.update(getProjectDoc(projectId, collectionName, item.id), { order: item.order });
        })
    );
}

async function saveProjectItems<T extends { id: string }>(
    projectId: string,
    collectionName: string,
    items: T[],
): Promise<void> {
    await commitChunkedOperations(
        items.map(item => (batch) => {
            const clean = sanitizeForFirestore(item);
            batch.set(getProjectDoc(projectId, collectionName, clean.id), clean);
        })
    );
}

async function replaceProjectCollection<T extends { id: string }>(
    projectId: string,
    collectionName: string,
    items: T[],
): Promise<void> {
    const existingSnap = await getDocs(getProjectCollection(projectId, collectionName));
    const incomingIds = new Set(items.map(item => item.id));
    const operations: ((batch: WriteBatch) => void)[] = [];

    for (const existingDoc of existingSnap.docs) {
        if (!incomingIds.has(existingDoc.id)) {
            operations.push((batch) => {
                batch.delete(getProjectDoc(projectId, collectionName, existingDoc.id));
            });
        }
    }

    for (const item of items) {
        const clean = sanitizeForFirestore(item);
        operations.push((batch) => {
            batch.set(getProjectDoc(projectId, collectionName, clean.id), clean);
        });
    }

    await commitChunkedOperations(operations);
}

// ---------------------------------------------------------------------------
// Storage API
// ---------------------------------------------------------------------------
export const storage = {

    // -------------------------------------------------------------------------
    // Projects
    // -------------------------------------------------------------------------

    subscribeToProjects: (userId: string, callback: (projects: Project[]) => void): Unsubscribe => {
        const refsCollection = getUserCollection(userId, COLLECTIONS.PROJECT_REFS);
        const projectUnsubscribers = new Map<string, Unsubscribe>();
        const projectsMap = new Map<string, Project>();

        const notifyCallback = () => {
            const projects = Array.from(projectsMap.values()).sort(byCreatedAtDesc);
            callback(projects);
        };

        const refsUnsub = onSnapshot(query(refsCollection), (refsSnap) => {
            const currentIds = new Set(refsSnap.docs.map(d => d.id));

            for (const [id, unsub] of projectUnsubscribers) {
                if (!currentIds.has(id)) {
                    unsub();
                    projectUnsubscribers.delete(id);
                    projectsMap.delete(id);
                }
            }

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
        const cleanProject = sanitizeForFirestore(project);
        const projectDocRef = doc(db, COLLECTIONS.PROJECTS, cleanProject.id);
        await setDoc(projectDocRef, cleanProject);
        const role = cleanProject.members[userId]?.role ?? 'owner';
        await setDoc(getProjectRefDoc(userId, cleanProject.id), { projectId: cleanProject.id, role } as ProjectRef);
    },

    deleteProject: async (userId: string, projectId: string) => {
        const projectDocRef = doc(db, COLLECTIONS.PROJECTS, projectId);
        const projectSnap = await getDoc(projectDocRef);
        const memberUids = new Set<string>([userId]);
        if (projectSnap.exists()) {
            const projectData = projectSnap.data() as Project;
            for (const uid of Object.keys(projectData.members ?? {})) {
                memberUids.add(uid);
            }
        }

        const subcollectionSnapshots = await Promise.all(
            PROJECT_SUBCOLLECTIONS.map(async (subName) => ({
                subName,
                snap: await getDocs(getProjectCollection(projectId, subName)),
            }))
        );

        const operations: ((batch: WriteBatch) => void)[] = [];

        for (const { subName, snap } of subcollectionSnapshots) {
            for (const docSnap of snap.docs) {
                operations.push((batch) => {
                    batch.delete(getProjectDoc(projectId, subName, docSnap.id));
                });
            }
        }

        for (const uid of memberUids) {
            operations.push((batch) => {
                batch.delete(getProjectRefDoc(uid, projectId));
            });
        }

        operations.push((batch) => {
            batch.delete(projectDocRef);
        });

        await commitChunkedOperations(operations);
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
        await setDoc(invitationRef, sanitizeForFirestore(invitation));
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
        await updateDoc(projectDocRef, {
            [`members.${user.uid}`]: member,
        });
        await setDoc(getProjectRefDoc(user.uid, invitation.projectId), {
            projectId: invitation.projectId,
            role: invitation.role,
        } as ProjectRef);
        const invitationRef = doc(db, COLLECTIONS.INVITATIONS, invitation.id);
        await updateDoc(invitationRef, { status: 'accepted' });
    },

    updateMemberRole: async (projectId: string, targetUserId: string, role: ProjectRole) => {
        const projectDocRef = doc(db, COLLECTIONS.PROJECTS, projectId);
        await updateDoc(projectDocRef, { [`members.${targetUserId}.role`]: role });
        await setDoc(getProjectRefDoc(targetUserId, projectId), { projectId, role } as ProjectRef, { merge: true });
    },

    removeMember: async (projectId: string, targetUserId: string) => {
        const projectDocRef = doc(db, COLLECTIONS.PROJECTS, projectId);
        const batch = writeBatch(db);
        batch.update(projectDocRef, { [`members.${targetUserId}`]: deleteField() });
        batch.delete(getProjectRefDoc(targetUserId, projectId));
        await batch.commit();
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

    subscribeToLocations: (projectId: string, callback: (locations: Location[]) => void): Unsubscribe =>
        subscribeProjectCollection(projectId, COLLECTIONS.LOCATIONS, byOrder, callback),

    updateLocationOrders: (projectId: string, locations: Location[]) =>
        updateProjectOrders(projectId, COLLECTIONS.LOCATIONS, locations),

    saveLocation: (projectId: string, location: Location) =>
        saveProjectItem(projectId, COLLECTIONS.LOCATIONS, location),

    deleteLocation: (projectId: string, locationId: string) =>
        deleteProjectItem(projectId, COLLECTIONS.LOCATIONS, locationId),

    replaceAllLocations: (projectId: string, locations: Location[]) =>
        replaceProjectCollection(projectId, COLLECTIONS.LOCATIONS, locations),

    // -------------------------------------------------------------------------
    // Scenes
    // -------------------------------------------------------------------------

    subscribeToScenes: (projectId: string, callback: (scenes: Scene[]) => void): Unsubscribe =>
        subscribeProjectCollection(projectId, COLLECTIONS.SCENES, byOrder, callback),

    updateSceneOrders: (projectId: string, scenes: Scene[]) =>
        updateProjectOrders(projectId, COLLECTIONS.SCENES, scenes),

    saveScene: (projectId: string, scene: Scene) =>
        saveProjectItem(projectId, COLLECTIONS.SCENES, scene),

    updateSceneShots: async (projectId: string, sceneId: string, shots: Shot[]) => {
        await updateDoc(getProjectDoc(projectId, COLLECTIONS.SCENES, sceneId), {
            shots: sanitizeForFirestore(shots),
        });
    },

    updateSceneGroups: async (projectId: string, sceneId: string, groups: ShotGroup[]) => {
        await updateDoc(getProjectDoc(projectId, COLLECTIONS.SCENES, sceneId), {
            groups: sanitizeForFirestore(groups),
        });
    },

    deleteScene: (projectId: string, sceneId: string) =>
        deleteProjectItem(projectId, COLLECTIONS.SCENES, sceneId),

    replaceAllScenes: (projectId: string, scenes: Scene[]) =>
        replaceProjectCollection(projectId, COLLECTIONS.SCENES, scenes),

    // -------------------------------------------------------------------------
    // Characters
    // -------------------------------------------------------------------------

    subscribeToCharacters: (projectId: string, callback: (characters: Character[]) => void): Unsubscribe =>
        subscribeProjectCollection(projectId, COLLECTIONS.CHARACTERS, byOrder, callback),

    updateCharacterOrders: (projectId: string, characters: Character[]) =>
        updateProjectOrders(projectId, COLLECTIONS.CHARACTERS, characters),

    saveCharacter: (projectId: string, character: Character) =>
        saveProjectItem(projectId, COLLECTIONS.CHARACTERS, character),

    deleteCharacter: (projectId: string, characterId: string) =>
        deleteProjectItem(projectId, COLLECTIONS.CHARACTERS, characterId),

    replaceAllCharacters: (projectId: string, characters: Character[]) =>
        replaceProjectCollection(projectId, COLLECTIONS.CHARACTERS, characters),

    // -------------------------------------------------------------------------
    // Schedules
    // -------------------------------------------------------------------------

    subscribeToSchedules: (projectId: string, callback: (schedules: Schedule[]) => void): Unsubscribe =>
        subscribeProjectCollection(projectId, COLLECTIONS.SCHEDULES, byUpdatedAtDesc, callback),

    saveSchedule: (projectId: string, schedule: Schedule) =>
        saveProjectItem(projectId, COLLECTIONS.SCHEDULES, schedule),

    deleteSchedule: (projectId: string, scheduleId: string) =>
        deleteProjectItem(projectId, COLLECTIONS.SCHEDULES, scheduleId),

    // -------------------------------------------------------------------------
    // Assets
    // -------------------------------------------------------------------------

    subscribeToAssets: (projectId: string, callback: (assets: Asset[]) => void): Unsubscribe =>
        subscribeProjectCollection(projectId, COLLECTIONS.ASSETS, byOrder, callback),

    updateAssetOrders: (projectId: string, assets: Asset[]) =>
        updateProjectOrders(projectId, COLLECTIONS.ASSETS, assets),

    saveAsset: (projectId: string, asset: Asset) =>
        saveProjectItem(projectId, COLLECTIONS.ASSETS, asset),

    deleteAsset: (projectId: string, assetId: string) =>
        deleteProjectItem(projectId, COLLECTIONS.ASSETS, assetId),

    // -------------------------------------------------------------------------
    // People
    // -------------------------------------------------------------------------

    subscribeToPeople: (projectId: string, callback: (people: Person[]) => void): Unsubscribe =>
        subscribeProjectCollection(projectId, COLLECTIONS.PEOPLE, byOrder, callback),

    updatePersonOrders: (projectId: string, people: Person[]) =>
        updateProjectOrders(projectId, COLLECTIONS.PEOPLE, people),

    savePerson: (projectId: string, person: Person) =>
        saveProjectItem(projectId, COLLECTIONS.PEOPLE, person),

    deletePerson: (projectId: string, personId: string) =>
        deleteProjectItem(projectId, COLLECTIONS.PEOPLE, personId),

    // -------------------------------------------------------------------------
    // Plans
    // -------------------------------------------------------------------------

    subscribeToPlans: (projectId: string, callback: (plans: Plan[]) => void): Unsubscribe =>
        subscribeProjectCollection(projectId, COLLECTIONS.PLANS, byUpdatedAtDesc, callback),

    savePlan: (projectId: string, plan: Plan) =>
        saveProjectItem(projectId, COLLECTIONS.PLANS, plan),

    deletePlan: (projectId: string, planId: string) =>
        deleteProjectItem(projectId, COLLECTIONS.PLANS, planId),

    // -------------------------------------------------------------------------
    // Tasks
    // -------------------------------------------------------------------------

    subscribeToTasks: (projectId: string, callback: (tasks: Task[]) => void): Unsubscribe =>
        subscribeProjectCollection(projectId, COLLECTIONS.TASKS, byOrder, callback),

    saveTask: (projectId: string, task: Task) =>
        saveProjectItem(projectId, COLLECTIONS.TASKS, task),

    saveTasks: (projectId: string, tasks: Task[]) =>
        saveProjectItems(projectId, COLLECTIONS.TASKS, tasks),

    deleteTask: (projectId: string, taskId: string) =>
        deleteProjectItem(projectId, COLLECTIONS.TASKS, taskId),

    // -------------------------------------------------------------------------
    // Settings (remain user-scoped)
    // -------------------------------------------------------------------------

    subscribeToSettings: (userId: string, callback: (settings: Settings | null) => void): Unsubscribe => {
        return onSnapshot(getSettingsDoc(userId), (docSnap) => {
            callback(docSnap.exists() ? (docSnap.data() as Settings) : null);
        });
    },

    saveSettings: async (userId: string, settings: Settings) => {
        await setDoc(getSettingsDoc(userId), sanitizeForFirestore(settings));
    },

    // -------------------------------------------------------------------------
    // Stats (for project dashboard)
    // -------------------------------------------------------------------------

    getAllProjectStats: async (userId: string) => {
        const refsSnap = await getDocs(getUserCollection(userId, COLLECTIONS.PROJECT_REFS));
        const projectIds = refsSnap.docs.map(d => d.id);

        const results = await Promise.all(projectIds.map(async (projectId) => {
            const [locsCountSnap, charsCountSnap, scenesSnap] = await Promise.all([
                getCountFromServer(getProjectCollection(projectId, COLLECTIONS.LOCATIONS)),
                getCountFromServer(getProjectCollection(projectId, COLLECTIONS.CHARACTERS)),
                getDocs(getProjectCollection(projectId, COLLECTIONS.SCENES)),
            ]);
            let shots = 0;
            let length = 0;
            scenesSnap.docs.forEach(d => {
                const scene = d.data() as Scene;
                shots += scene.shots?.length ?? 0;
                length += (scene.shots ?? []).reduce((acc, s) => acc + (s.length ?? 0), 0);
            });
            return [projectId, {
                locations: locsCountSnap.data().count,
                characters: charsCountSnap.data().count,
                scenes: scenesSnap.size,
                shots,
                length,
            }] as const;
        }));

        return Object.fromEntries(results);
    },

    // -------------------------------------------------------------------------
    // Script (one per project)
    // -------------------------------------------------------------------------

    subscribeToScript: (projectId: string, callback: (script: Script | null) => void): Unsubscribe => {
        const scriptDoc = getProjectDoc(projectId, COLLECTIONS.SCRIPT, 'main');
        return onSnapshot(scriptDoc, (snap) => {
            callback(snap.exists() ? (snap.data() as Script) : null);
        });
    },

    saveScript: async (projectId: string, script: Script) => {
        const scriptDoc = getProjectDoc(projectId, COLLECTIONS.SCRIPT, 'main');
        await setDoc(scriptDoc, sanitizeForFirestore(script));
    },

    setScriptFrozen: async (projectId: string, frozen: boolean) => {
        const scriptDoc = getProjectDoc(projectId, COLLECTIONS.SCRIPT, 'main');
        await setDoc(scriptDoc, { frozen }, { merge: true });
    },

    // -------------------------------------------------------------------------
    // Script Revisions
    // -------------------------------------------------------------------------

    subscribeToScriptRevisions: (projectId: string, callback: (revisions: ScriptRevision[]) => void): Unsubscribe =>
        subscribeProjectCollection(projectId, COLLECTIONS.SCRIPT_REVISIONS, byCreatedAtDesc, callback),

    saveScriptRevision: (projectId: string, revision: ScriptRevision) =>
        saveProjectItem(projectId, COLLECTIONS.SCRIPT_REVISIONS, revision),

    deleteScriptRevision: (projectId: string, revisionId: string) =>
        deleteProjectItem(projectId, COLLECTIONS.SCRIPT_REVISIONS, revisionId),

    // -------------------------------------------------------------------------
    // Acts
    // -------------------------------------------------------------------------

    subscribeToActs: (projectId: string, callback: (acts: Act[]) => void): Unsubscribe =>
        subscribeProjectCollection(projectId, COLLECTIONS.ACTS, (a, b) => a.order - b.order, callback),

    saveAct: (projectId: string, act: Act) =>
        saveProjectItem(projectId, COLLECTIONS.ACTS, act),

    deleteAct: (projectId: string, actId: string) =>
        deleteProjectItem(projectId, COLLECTIONS.ACTS, actId),

    // -------------------------------------------------------------------------
    // Beats
    // -------------------------------------------------------------------------

    subscribeToBeats: (projectId: string, callback: (beats: Beat[]) => void): Unsubscribe =>
        subscribeProjectCollection(projectId, COLLECTIONS.BEATS, (a, b) => a.order - b.order, callback),

    saveBeat: (projectId: string, beat: Beat) =>
        saveProjectItem(projectId, COLLECTIONS.BEATS, beat),

    deleteBeat: (projectId: string, beatId: string) =>
        deleteProjectItem(projectId, COLLECTIONS.BEATS, beatId),

    saveBeats: (projectId: string, beats: Beat[]) =>
        saveProjectItems(projectId, COLLECTIONS.BEATS, beats),

    // -------------------------------------------------------------------------
    // Knowledge Base (Techniques, Reference Shots, Guides)
    // -------------------------------------------------------------------------

    getKnowledgeItems: async (): Promise<KnowledgeItem[]> => {
        const snapshot = await getDocs(query(collection(db, COLLECTIONS.KNOWLEDGE)));
        const items = snapshot.docs.map(d => d.data() as KnowledgeItem);
        items.sort(byCreatedAtDesc);
        return items;
    },

    subscribeToKnowledgeItems: (callback: (items: KnowledgeItem[]) => void): Unsubscribe => {
        return onSnapshot(query(collection(db, COLLECTIONS.KNOWLEDGE)), (snapshot) => {
            const items = snapshot.docs.map(d => d.data() as KnowledgeItem);
            items.sort(byCreatedAtDesc);
            callback(items);
        });
    },

    saveKnowledgeItem: async (item: KnowledgeItem) => {
        const clean = sanitizeForFirestore(item);
        await setDoc(doc(db, COLLECTIONS.KNOWLEDGE, clean.id), clean);
    },

    deleteKnowledgeItem: async (itemId: string) => {
        await deleteDoc(doc(db, COLLECTIONS.KNOWLEDGE, itemId));
    },

};
