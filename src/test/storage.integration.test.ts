/**
 * Integration tests against the Firebase emulator.
 *
 * Prerequisites:
 *   npx firebase emulators:start --only auth,firestore
 *
 * Run with:
 *   npm run test:run -- src/test/storage.integration.test.ts
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
} from 'firebase/auth';
import {
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    deleteDoc,
} from 'firebase/firestore';
import { getEmulatorApp, clearEmulatorData, teardownEmulator } from './emulator';

const TEST_EMAIL = 'test@kopfkino.test';
const TEST_PASSWORD = 'password123';

describe('Firebase emulator integration', () => {
    const { db, auth } = (() => {
        try { return getEmulatorApp(); }
        catch { return { db: null, auth: null }; }
    })();

    beforeAll(async () => {
        if (!db || !auth) return;
        await clearEmulatorData();
    });

    afterAll(async () => {
        await teardownEmulator();
    });

    beforeEach(async () => {
        if (!db) return;
        await clearEmulatorData();
    });

    // -------------------------------------------------------------------------
    // Auth
    // -------------------------------------------------------------------------

    describe('Auth', () => {
        it('creates a new user', async () => {
            if (!auth) return;
            const cred = await createUserWithEmailAndPassword(auth, TEST_EMAIL, TEST_PASSWORD);
            expect(cred.user.email).toBe(TEST_EMAIL);
            expect(cred.user.uid).toBeTruthy();
        });

        it('signs in an existing user', async () => {
            if (!auth) return;
            await createUserWithEmailAndPassword(auth, TEST_EMAIL, TEST_PASSWORD);
            await signOut(auth);
            const cred = await signInWithEmailAndPassword(auth, TEST_EMAIL, TEST_PASSWORD);
            expect(cred.user.email).toBe(TEST_EMAIL);
        });

        it('signs out successfully', async () => {
            if (!auth) return;
            await createUserWithEmailAndPassword(auth, TEST_EMAIL, TEST_PASSWORD);
            await signOut(auth);
            expect(auth.currentUser).toBeNull();
        });
    });

    // -------------------------------------------------------------------------
    // Project CRUD (bypasses security rules — emulator admin access)
    // -------------------------------------------------------------------------

    describe('Project CRUD', () => {
        const projectId = 'proj-test-1';

        const makeProjectDoc = (uid: string) => ({
            id: projectId,
            name: 'Test Project',
            description: 'Integration test project',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            ownerId: uid,
            members: {
                [uid]: { role: 'owner', email: TEST_EMAIL, displayName: 'Tester', addedAt: Date.now() },
            },
        });

        it('writes and reads a project document', async () => {
            if (!db || !auth) return;
            const { user } = await createUserWithEmailAndPassword(auth, TEST_EMAIL, TEST_PASSWORD);
            const projectDoc = makeProjectDoc(user.uid);
            await setDoc(doc(db, 'projects', projectId), projectDoc);
            const snap = await getDoc(doc(db, 'projects', projectId));
            expect(snap.exists()).toBe(true);
            expect(snap.data()?.name).toBe('Test Project');
            expect(snap.data()?.members[user.uid]?.role).toBe('owner');
        });

        it('deletes a project document', async () => {
            if (!db || !auth) return;
            const { user } = await createUserWithEmailAndPassword(auth, TEST_EMAIL, TEST_PASSWORD);
            await setDoc(doc(db, 'projects', projectId), makeProjectDoc(user.uid));
            await deleteDoc(doc(db, 'projects', projectId));
            const snap = await getDoc(doc(db, 'projects', projectId));
            expect(snap.exists()).toBe(false);
        });
    });

    // -------------------------------------------------------------------------
    // Location CRUD inside a project
    // -------------------------------------------------------------------------

    describe('Location CRUD', () => {
        const projectId = 'proj-loc-test';
        const locationId = 'loc-1';

        it('writes and reads a location under a project', async () => {
            if (!db || !auth) return;
            const { user } = await createUserWithEmailAndPassword(auth, TEST_EMAIL, TEST_PASSWORD);

            // Set up project first
            await setDoc(doc(db, 'projects', projectId), {
                id: projectId, name: 'Loc Test Project', description: '',
                createdAt: 0, updatedAt: 0, ownerId: user.uid,
                members: { [user.uid]: { role: 'owner', email: TEST_EMAIL, displayName: 'T', addedAt: 0 } },
            });

            const location = {
                id: locationId, projectId, name: 'Rooftop', description: 'City rooftop', order: 0,
            };
            await setDoc(doc(db, 'projects', projectId, 'locations', locationId), location);

            const snap = await getDoc(doc(db, 'projects', projectId, 'locations', locationId));
            expect(snap.exists()).toBe(true);
            expect(snap.data()?.name).toBe('Rooftop');
        });

        it('lists all locations for a project', async () => {
            if (!db || !auth) return;
            const { user } = await createUserWithEmailAndPassword(auth, TEST_EMAIL, TEST_PASSWORD);

            await setDoc(doc(db, 'projects', projectId), {
                id: projectId, name: 'Multi-loc Project', description: '',
                createdAt: 0, updatedAt: 0, ownerId: user.uid,
                members: { [user.uid]: { role: 'owner', email: TEST_EMAIL, displayName: 'T', addedAt: 0 } },
            });

            await setDoc(doc(db, 'projects', projectId, 'locations', 'loc-a'), {
                id: 'loc-a', projectId, name: 'A', description: '', order: 1,
            });
            await setDoc(doc(db, 'projects', projectId, 'locations', 'loc-b'), {
                id: 'loc-b', projectId, name: 'B', description: '', order: 0,
            });

            const snap = await getDocs(collection(db, 'projects', projectId, 'locations'));
            expect(snap.docs).toHaveLength(2);
        });

        it('deletes a location', async () => {
            if (!db || !auth) return;
            const { user } = await createUserWithEmailAndPassword(auth, TEST_EMAIL, TEST_PASSWORD);

            await setDoc(doc(db, 'projects', projectId), {
                id: projectId, name: 'Del Test', description: '',
                createdAt: 0, updatedAt: 0, ownerId: user.uid,
                members: { [user.uid]: { role: 'owner', email: TEST_EMAIL, displayName: 'T', addedAt: 0 } },
            });

            await setDoc(doc(db, 'projects', projectId, 'locations', locationId), {
                id: locationId, projectId, name: 'To Delete', description: '',
            });
            await deleteDoc(doc(db, 'projects', projectId, 'locations', locationId));
            const snap = await getDoc(doc(db, 'projects', projectId, 'locations', locationId));
            expect(snap.exists()).toBe(false);
        });
    });
});
