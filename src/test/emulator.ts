import { initializeApp, deleteApp, type FirebaseApp } from 'firebase/app';
import {
    getFirestore,
    connectFirestoreEmulator,
    type Firestore,
    terminate,
} from 'firebase/firestore';
import {
    getAuth,
    connectAuthEmulator,
    type Auth,
    signOut,
} from 'firebase/auth';

const EMULATOR_PROJECT = 'kopfkino-test';

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;

export function getEmulatorApp(): { app: FirebaseApp; db: Firestore; auth: Auth } {
    if (!app) {
        app = initializeApp({ projectId: EMULATOR_PROJECT }, 'test-app');
        db = getFirestore(app);
        auth = getAuth(app);
        connectFirestoreEmulator(db, '127.0.0.1', 8080);
        connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    }
    return { app, db: db!, auth: auth! };
}

export async function clearEmulatorData(): Promise<void> {
    const response = await fetch(
        `http://127.0.0.1:8080/emulator/v1/projects/${EMULATOR_PROJECT}/databases/(default)/documents`,
        { method: 'DELETE' }
    );
    if (!response.ok) {
        throw new Error(`Failed to clear Firestore emulator: ${response.status}`);
    }
}

export async function teardownEmulator(): Promise<void> {
    if (auth) await signOut(auth).catch(() => {});
    if (db) await terminate(db);
    if (app) await deleteApp(app);
    app = null;
    db = null;
    auth = null;
}
