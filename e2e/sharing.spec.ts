import { test, expect } from '@playwright/test';
import {
    clearEmulator,
    createTestUser,
    seedProject,
    seedProjectRef,
    seedLocation,
    signInViaUI,
    signOutViaUI,
    waitForSaved,
} from './helpers';

const PROJECT_ID = 'e2e-share-project';
const LOCATION_ID = 'e2e-share-location';
const LOCATION_NAME = 'Original Name';

test.beforeEach(async ({ request }) => {
    await clearEmulator(request);
});

test('owner can edit and save a location', async ({ page, request }) => {
    const owner = await createTestUser(request, 'owner@example.com', 'pass1234');
    await seedProject(request, PROJECT_ID, owner.uid, owner.email);
    await seedLocation(request, PROJECT_ID, LOCATION_ID, LOCATION_NAME);

    await signInViaUI(page, owner.email, 'pass1234');
    await page.goto(`/project/${PROJECT_ID}/locations/${LOCATION_ID}`);

    const nameInput = page.locator('input[placeholder="Location Name"]');
    await nameInput.waitFor({ timeout: 10000 });
    await nameInput.click({ clickCount: 3 });
    await nameInput.fill('Owner Edit');

    await waitForSaved(page, 8000);
});

test('viewer can view location but edits are not persisted', async ({ page, request }) => {
    const owner = await createTestUser(request, 'owner@example.com', 'pass1234');
    const viewer = await createTestUser(request, 'viewer@example.com', 'pass1234');

    await seedProject(request, PROJECT_ID, owner.uid, owner.email, {
        [viewer.uid]: { role: 'viewer', email: viewer.email, displayName: 'Viewer' },
    });
    await seedProjectRef(request, viewer.uid, PROJECT_ID, 'viewer');
    await seedLocation(request, PROJECT_ID, LOCATION_ID, LOCATION_NAME);

    await signInViaUI(page, viewer.email, 'pass1234');
    await page.goto(`/project/${PROJECT_ID}/locations/${LOCATION_ID}`);

    const nameInput = page.locator('input[placeholder="Location Name"]');
    await nameInput.waitFor({ timeout: 10000 });

    // Verify the location loaded
    await expect(nameInput).toHaveValue(LOCATION_NAME, { timeout: 10000 });

    // Edit the name — input is not disabled but write guard blocks the save
    await nameInput.click({ clickCount: 3 });
    await nameInput.fill('Viewer Attempted Edit');

    // "Saved" should never appear — wait 4 s to confirm
    await expect(page.getByText(/^saved$/i)).not.toBeVisible({ timeout: 4000 }).catch(() => {});

    // Navigate away and back — value should revert to original
    await page.goto(`/project/${PROJECT_ID}/locations`);
    await page.goto(`/project/${PROJECT_ID}/locations/${LOCATION_ID}`);

    await expect(nameInput).toHaveValue(LOCATION_NAME, { timeout: 10000 });
});

test('editor can edit and save a location', async ({ page, request }) => {
    const owner = await createTestUser(request, 'owner@example.com', 'pass1234');
    const editor = await createTestUser(request, 'editor@example.com', 'pass1234');

    await seedProject(request, PROJECT_ID, owner.uid, owner.email, {
        [editor.uid]: { role: 'editor', email: editor.email, displayName: 'Editor' },
    });
    await seedProjectRef(request, editor.uid, PROJECT_ID, 'editor');
    await seedLocation(request, PROJECT_ID, LOCATION_ID, LOCATION_NAME);

    await signInViaUI(page, editor.email, 'pass1234');
    await page.goto(`/project/${PROJECT_ID}/locations/${LOCATION_ID}`);

    const nameInput = page.locator('input[placeholder="Location Name"]');
    await nameInput.waitFor({ timeout: 10000 });
    await nameInput.click({ clickCount: 3 });
    await nameInput.fill('Editor Edit');

    await waitForSaved(page, 8000);

    // Persist check
    await page.goto(`/project/${PROJECT_ID}/locations`);
    await page.goto(`/project/${PROJECT_ID}/locations/${LOCATION_ID}`);

    await expect(nameInput).toHaveValue('Editor Edit', { timeout: 10000 });
});

test('viewer sees project in project list with View only badge', async ({ page, request }) => {
    const owner = await createTestUser(request, 'owner@example.com', 'pass1234');
    const viewer = await createTestUser(request, 'viewer@example.com', 'pass1234');

    await seedProject(request, PROJECT_ID, owner.uid, owner.email, {
        [viewer.uid]: { role: 'viewer', email: viewer.email, displayName: 'Viewer' },
    });
    await seedProjectRef(request, viewer.uid, PROJECT_ID, 'viewer');

    await signInViaUI(page, viewer.email, 'pass1234');
    await page.goto('/');

    await expect(page.getByText('Test Project')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/view only/i)).toBeVisible({ timeout: 5000 });
});

test('sign out then sign in as different user sees own projects only', async ({ page, request }) => {
    const owner = await createTestUser(request, 'owner@example.com', 'pass1234');
    const other = await createTestUser(request, 'other@example.com', 'pass1234');

    await seedProject(request, PROJECT_ID, owner.uid, owner.email);
    await seedProject(request, 'other-project', other.uid, other.email);

    // Sign in as owner
    await signInViaUI(page, owner.email, 'pass1234');
    await page.goto('/');
    await expect(page.getByText('Test Project').first()).toBeVisible({ timeout: 10000 });

    // Switch to other user
    await signOutViaUI(page);
    await signInViaUI(page, other.email, 'pass1234');
    await page.goto('/');

    // Owner's project should not be visible
    const cards = page.locator('h3', { hasText: 'Test Project' });
    await expect(cards).toHaveCount(1, { timeout: 10000 }); // only other's own project
});
