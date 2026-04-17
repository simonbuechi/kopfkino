/**
 * Firestore security rules tests.
 * Requires the emulator: npx firebase emulators:start --only firestore
 */
import { describe, it, beforeAll, afterAll, beforeEach } from 'vitest';
import {
    initializeTestEnvironment,
    assertSucceeds,
    assertFails,
    type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { doc, getDoc, setDoc, deleteDoc, collection, getDocs } from 'firebase/firestore';

const PROJECT_ID = 'kopfkino-test';
const RULES_PATH = resolve(process.cwd(), 'firestore.rules');

let testEnv: RulesTestEnvironment;

// UID constants
const OWNER_UID = 'owner-uid';
const EDITOR_UID = 'editor-uid';
const VIEWER_UID = 'viewer-uid';
const STRANGER_UID = 'stranger-uid';
const PROJECT_ID_DOC = 'test-project';

const makeProject = () => ({
    id: PROJECT_ID_DOC,
    name: 'Test Project',
    description: '',
    createdAt: 1000,
    updatedAt: 1000,
    ownerId: OWNER_UID,
    members: {
        [OWNER_UID]: { role: 'owner', email: 'owner@test.com', displayName: 'Owner', addedAt: 1000 },
        [EDITOR_UID]: { role: 'editor', email: 'editor@test.com', displayName: 'Editor', addedAt: 1000 },
        [VIEWER_UID]: { role: 'viewer', email: 'viewer@test.com', displayName: 'Viewer', addedAt: 1000 },
    },
});

const makeLocation = () => ({
    id: 'loc-1',
    projectId: PROJECT_ID_DOC,
    name: 'Rooftop',
    description: 'City rooftop',
    order: 0,
});

beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
        projectId: PROJECT_ID,
        firestore: {
            rules: readFileSync(RULES_PATH, 'utf8'),
            host: '127.0.0.1',
            port: 8080,
        },
    });
});

afterAll(async () => {
    await testEnv.cleanup();
});

beforeEach(async () => {
    await testEnv.clearFirestore();

    // Seed the project document via admin (bypasses rules)
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
        await setDoc(doc(ctx.firestore(), 'projects', PROJECT_ID_DOC), makeProject());
    });
});

// ---------------------------------------------------------------------------
// Project document
// ---------------------------------------------------------------------------

describe('Project document', () => {
    it('owner can read the project', async () => {
        const db = testEnv.authenticatedContext(OWNER_UID).firestore();
        await assertSucceeds(getDoc(doc(db, 'projects', PROJECT_ID_DOC)));
    });

    it('editor can read the project', async () => {
        const db = testEnv.authenticatedContext(EDITOR_UID).firestore();
        await assertSucceeds(getDoc(doc(db, 'projects', PROJECT_ID_DOC)));
    });

    it('viewer can read the project', async () => {
        const db = testEnv.authenticatedContext(VIEWER_UID).firestore();
        await assertSucceeds(getDoc(doc(db, 'projects', PROJECT_ID_DOC)));
    });

    it('non-member cannot read the project', async () => {
        const db = testEnv.authenticatedContext(STRANGER_UID).firestore();
        await assertFails(getDoc(doc(db, 'projects', PROJECT_ID_DOC)));
    });

    it('unauthenticated user cannot read the project', async () => {
        const db = testEnv.unauthenticatedContext().firestore();
        await assertFails(getDoc(doc(db, 'projects', PROJECT_ID_DOC)));
    });

    it('owner can update the project', async () => {
        const db = testEnv.authenticatedContext(OWNER_UID).firestore();
        await assertSucceeds(setDoc(doc(db, 'projects', PROJECT_ID_DOC), { ...makeProject(), name: 'Updated' }));
    });

    it('editor can update the project', async () => {
        const db = testEnv.authenticatedContext(EDITOR_UID).firestore();
        await assertSucceeds(setDoc(doc(db, 'projects', PROJECT_ID_DOC), { ...makeProject(), name: 'Updated' }));
    });

    it('viewer cannot update the project', async () => {
        const db = testEnv.authenticatedContext(VIEWER_UID).firestore();
        await assertFails(setDoc(doc(db, 'projects', PROJECT_ID_DOC), { ...makeProject(), name: 'Updated' }));
    });

    it('non-member cannot update the project', async () => {
        const db = testEnv.authenticatedContext(STRANGER_UID).firestore();
        await assertFails(setDoc(doc(db, 'projects', PROJECT_ID_DOC), { ...makeProject(), name: 'Updated' }));
    });

    it('owner can delete the project', async () => {
        const db = testEnv.authenticatedContext(OWNER_UID).firestore();
        await assertSucceeds(deleteDoc(doc(db, 'projects', PROJECT_ID_DOC)));
    });

    it('editor cannot delete the project', async () => {
        const db = testEnv.authenticatedContext(EDITOR_UID).firestore();
        await assertFails(deleteDoc(doc(db, 'projects', PROJECT_ID_DOC)));
    });

    it('owner can create a new project with their uid as ownerId', async () => {
        const db = testEnv.authenticatedContext(OWNER_UID).firestore();
        const newProject = { ...makeProject(), id: 'new-project' };
        await assertSucceeds(setDoc(doc(db, 'projects', 'new-project'), { ...newProject, ownerId: OWNER_UID }));
    });

    it('cannot create a project with a different ownerId', async () => {
        const db = testEnv.authenticatedContext(EDITOR_UID).firestore();
        await assertFails(
            setDoc(doc(db, 'projects', 'fake-project'), { ...makeProject(), id: 'fake-project', ownerId: OWNER_UID })
        );
    });
});

// ---------------------------------------------------------------------------
// Location subcollection
// ---------------------------------------------------------------------------

describe('Location subcollection', () => {
    beforeEach(async () => {
        await testEnv.withSecurityRulesDisabled(async (ctx) => {
            await setDoc(
                doc(ctx.firestore(), 'projects', PROJECT_ID_DOC, 'locations', 'loc-1'),
                makeLocation()
            );
        });
    });

    it('owner can read locations', async () => {
        const db = testEnv.authenticatedContext(OWNER_UID).firestore();
        await assertSucceeds(getDocs(collection(db, 'projects', PROJECT_ID_DOC, 'locations')));
    });

    it('editor can read locations', async () => {
        const db = testEnv.authenticatedContext(EDITOR_UID).firestore();
        await assertSucceeds(getDocs(collection(db, 'projects', PROJECT_ID_DOC, 'locations')));
    });

    it('viewer can read locations', async () => {
        const db = testEnv.authenticatedContext(VIEWER_UID).firestore();
        await assertSucceeds(getDocs(collection(db, 'projects', PROJECT_ID_DOC, 'locations')));
    });

    it('non-member cannot read locations', async () => {
        const db = testEnv.authenticatedContext(STRANGER_UID).firestore();
        await assertFails(getDocs(collection(db, 'projects', PROJECT_ID_DOC, 'locations')));
    });

    it('owner can write a location', async () => {
        const db = testEnv.authenticatedContext(OWNER_UID).firestore();
        await assertSucceeds(
            setDoc(doc(db, 'projects', PROJECT_ID_DOC, 'locations', 'loc-new'), makeLocation())
        );
    });

    it('editor can write a location', async () => {
        const db = testEnv.authenticatedContext(EDITOR_UID).firestore();
        await assertSucceeds(
            setDoc(doc(db, 'projects', PROJECT_ID_DOC, 'locations', 'loc-new'), makeLocation())
        );
    });

    it('viewer cannot write a location', async () => {
        const db = testEnv.authenticatedContext(VIEWER_UID).firestore();
        await assertFails(
            setDoc(doc(db, 'projects', PROJECT_ID_DOC, 'locations', 'loc-new'), makeLocation())
        );
    });

    it('non-member cannot write a location', async () => {
        const db = testEnv.authenticatedContext(STRANGER_UID).firestore();
        await assertFails(
            setDoc(doc(db, 'projects', PROJECT_ID_DOC, 'locations', 'loc-new'), makeLocation())
        );
    });

    it('unauthenticated user cannot write a location', async () => {
        const db = testEnv.unauthenticatedContext().firestore();
        await assertFails(
            setDoc(doc(db, 'projects', PROJECT_ID_DOC, 'locations', 'loc-new'), makeLocation())
        );
    });

    it('owner can delete a location', async () => {
        const db = testEnv.authenticatedContext(OWNER_UID).firestore();
        await assertSucceeds(deleteDoc(doc(db, 'projects', PROJECT_ID_DOC, 'locations', 'loc-1')));
    });

    it('viewer cannot delete a location', async () => {
        const db = testEnv.authenticatedContext(VIEWER_UID).firestore();
        await assertFails(deleteDoc(doc(db, 'projects', PROJECT_ID_DOC, 'locations', 'loc-1')));
    });
});

// ---------------------------------------------------------------------------
// User-scoped data (projectRefs, settings)
// ---------------------------------------------------------------------------

describe('User-scoped data', () => {
    it('user can read their own projectRefs', async () => {
        const db = testEnv.authenticatedContext(OWNER_UID).firestore();
        await assertSucceeds(getDocs(collection(db, 'users', OWNER_UID, 'projectRefs')));
    });

    it('user cannot read another user\'s projectRefs', async () => {
        const db = testEnv.authenticatedContext(OWNER_UID).firestore();
        await assertFails(getDocs(collection(db, 'users', STRANGER_UID, 'projectRefs')));
    });

    it('user can write their own settings', async () => {
        const db = testEnv.authenticatedContext(OWNER_UID).firestore();
        await assertSucceeds(
            setDoc(doc(db, 'users', OWNER_UID, 'settings', 'general'), { aspectRatio: '16:9', useRandomSeed: true })
        );
    });

    it('user cannot write to another user\'s settings', async () => {
        const db = testEnv.authenticatedContext(EDITOR_UID).firestore();
        await assertFails(
            setDoc(doc(db, 'users', OWNER_UID, 'settings', 'general'), { aspectRatio: '1:1', useRandomSeed: false })
        );
    });
});
