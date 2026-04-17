import { type Page, type APIRequestContext, expect } from '@playwright/test';

const EMULATOR_PROJECT = 'kopfkino-test';
const FIRESTORE_BASE = `http://127.0.0.1:8080/v1/projects/${EMULATOR_PROJECT}`;
const FIRESTORE_ADMIN_BASE = `http://127.0.0.1:8080/emulator/v1/projects/${EMULATOR_PROJECT}`;
const AUTH_BASE = `http://127.0.0.1:9099/emulator/v1/projects/${EMULATOR_PROJECT}`;
const ADMIN_HEADERS = { Authorization: 'Bearer owner', 'Content-Type': 'application/json' };

// ---------------------------------------------------------------------------
// Emulator data management
// ---------------------------------------------------------------------------

export async function clearEmulator(request: APIRequestContext): Promise<void> {
    await request.delete(`${FIRESTORE_ADMIN_BASE}/databases/(default)/documents`);
    await request.delete(`${AUTH_BASE}/accounts`);
}

// ---------------------------------------------------------------------------
// Auth helpers — create accounts via emulator REST API (no UI required)
// ---------------------------------------------------------------------------

export interface TestUser {
    uid: string;
    email: string;
    password: string;
    idToken: string;
}

export async function createTestUser(
    request: APIRequestContext,
    email: string,
    password: string
): Promise<TestUser> {
    const res = await request.post(
        'http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-key',
        { data: { email, password, returnSecureToken: true } }
    );
    const body = await res.json();
    return { uid: body.localId, email, password, idToken: body.idToken };
}

// ---------------------------------------------------------------------------
// Firestore seed helpers — write directly to emulator (no rules applied)
// ---------------------------------------------------------------------------

export async function seedProject(
    request: APIRequestContext,
    projectId: string,
    ownerId: string,
    ownerEmail: string,
    extraMembers: Record<string, { role: string; email: string; displayName: string }> = {}
): Promise<void> {
    const members: Record<string, object> = {
        [ownerId]: {
            mapValue: {
                fields: {
                    role: { stringValue: 'owner' },
                    email: { stringValue: ownerEmail },
                    displayName: { stringValue: 'Owner' },
                    addedAt: { integerValue: '1000' },
                },
            },
        },
        ...Object.fromEntries(
            Object.entries(extraMembers).map(([uid, m]) => [
                uid,
                {
                    mapValue: {
                        fields: {
                            role: { stringValue: m.role },
                            email: { stringValue: m.email },
                            displayName: { stringValue: m.displayName },
                            addedAt: { integerValue: '1000' },
                        },
                    },
                },
            ])
        ),
    };

    await request.patch(
        `${FIRESTORE_BASE}/databases/(default)/documents/projects/${projectId}`,
        {
            headers: ADMIN_HEADERS,
            data: {
                fields: {
                    id: { stringValue: projectId },
                    name: { stringValue: 'Test Project' },
                    description: { stringValue: '' },
                    ownerId: { stringValue: ownerId },
                    createdAt: { integerValue: '1000' },
                    updatedAt: { integerValue: '1000' },
                    members: { mapValue: { fields: members } },
                },
            },
        }
    );

    // Write projectRef so the app can find it
    await request.patch(
        `${FIRESTORE_BASE}/databases/(default)/documents/users/${ownerId}/projectRefs/${projectId}`,
        {
            headers: ADMIN_HEADERS,
            data: {
                fields: {
                    projectId: { stringValue: projectId },
                    role: { stringValue: 'owner' },
                },
            },
        }
    );
}

export async function seedProjectRef(
    request: APIRequestContext,
    userId: string,
    projectId: string,
    role: string
): Promise<void> {
    await request.patch(
        `${FIRESTORE_BASE}/databases/(default)/documents/users/${userId}/projectRefs/${projectId}`,
        {
            headers: ADMIN_HEADERS,
            data: {
                fields: {
                    projectId: { stringValue: projectId },
                    role: { stringValue: role },
                },
            },
        }
    );
}

export async function seedLocation(
    request: APIRequestContext,
    projectId: string,
    locationId: string,
    name: string
): Promise<void> {
    await request.patch(
        `${FIRESTORE_BASE}/databases/(default)/documents/projects/${projectId}/locations/${locationId}`,
        {
            headers: ADMIN_HEADERS,
            data: {
                fields: {
                    id: { stringValue: locationId },
                    projectId: { stringValue: projectId },
                    name: { stringValue: name },
                    description: { stringValue: 'Test description' },
                    order: { integerValue: '0' },
                },
            },
        }
    );
}

// ---------------------------------------------------------------------------
// Page helpers — sign in via the app's UI
// ---------------------------------------------------------------------------

export async function signInViaUI(page: Page, email: string, password: string): Promise<void> {
    await page.goto('/login');

    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="password"]').fill(password);
    await page.locator('button[type="submit"]').click();

    await page.waitForURL(/^(?!.*login).*$/, { timeout: 10000 });
}

export async function signOutViaUI(page: Page): Promise<void> {
    await page.getByRole('button', { name: /sign out/i }).click();
    await page.waitForURL('**/login**', { timeout: 5000 });
}

// ---------------------------------------------------------------------------
// Wait helpers
// ---------------------------------------------------------------------------

export async function waitForSaved(page: Page, timeout = 5000): Promise<void> {
    await expect(page.getByText(/^saved$/i)).toBeVisible({ timeout });
}

export async function waitForNoSaving(page: Page, timeout = 5000): Promise<void> {
    await expect(page.getByText(/saving/i)).toBeHidden({ timeout });
}
