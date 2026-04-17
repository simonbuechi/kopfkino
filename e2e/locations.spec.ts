import { test, expect } from '@playwright/test';
import {
    clearEmulator,
    createTestUser,
    seedProject,
    seedLocation,
    signInViaUI,
    waitForSaved,
} from './helpers';

const PROJECT_ID = 'e2e-project-1';
const LOCATION_ID = 'e2e-location-1';
const LOCATION_NAME = 'Old Factory';

test.beforeEach(async ({ request }) => {
    await clearEmulator(request);
});

test('location list shows seeded location', async ({ page, request }) => {
    const owner = await createTestUser(request, 'owner@example.com', 'pass1234');
    await seedProject(request, PROJECT_ID, owner.uid, owner.email);
    await seedLocation(request, PROJECT_ID, LOCATION_ID, LOCATION_NAME);

    await signInViaUI(page, owner.email, 'pass1234');
    await page.goto(`/project/${PROJECT_ID}/locations`);

    await expect(page.getByText(LOCATION_NAME)).toBeVisible({ timeout: 10000 });
});

test('create new location via form', async ({ page, request }) => {
    const owner = await createTestUser(request, 'owner@example.com', 'pass1234');
    await seedProject(request, PROJECT_ID, owner.uid, owner.email);

    await signInViaUI(page, owner.email, 'pass1234');
    await page.goto(`/project/${PROJECT_ID}/locations`);

    await page.getByRole('button', { name: /new location/i }).click();
    await page.waitForURL(/\/locations\/new/, { timeout: 5000 });

    await page.locator('input[name="name"]').fill('New Test Location');
    await page.locator('textarea[name="description"]').fill('A test description');
    await page.getByRole('button', { name: /save location/i }).click();

    await page.waitForURL(/\/locations$/, { timeout: 5000 });
    await expect(page.getByText('New Test Location')).toBeVisible({ timeout: 10000 });
});

test('edit location name triggers auto-save', async ({ page, request }) => {
    const owner = await createTestUser(request, 'owner@example.com', 'pass1234');
    await seedProject(request, PROJECT_ID, owner.uid, owner.email);
    await seedLocation(request, PROJECT_ID, LOCATION_ID, LOCATION_NAME);

    await signInViaUI(page, owner.email, 'pass1234');
    await page.goto(`/project/${PROJECT_ID}/locations/${LOCATION_ID}`);

    const nameInput = page.locator('input[placeholder="Location Name"]');
    await nameInput.waitFor({ timeout: 10000 });

    await nameInput.click({ clickCount: 3 });
    await nameInput.fill('Updated Factory');

    await waitForSaved(page, 8000);
});

test('auto-saved name persists after navigation', async ({ page, request }) => {
    const owner = await createTestUser(request, 'owner@example.com', 'pass1234');
    await seedProject(request, PROJECT_ID, owner.uid, owner.email);
    await seedLocation(request, PROJECT_ID, LOCATION_ID, LOCATION_NAME);

    await signInViaUI(page, owner.email, 'pass1234');
    await page.goto(`/project/${PROJECT_ID}/locations/${LOCATION_ID}`);

    const nameInput = page.locator('input[placeholder="Location Name"]');
    await nameInput.waitFor({ timeout: 10000 });
    await nameInput.click({ clickCount: 3 });
    await nameInput.fill('Renamed Location');

    await waitForSaved(page, 8000);

    // Navigate away and back
    await page.goto(`/project/${PROJECT_ID}/locations`);
    await page.goto(`/project/${PROJECT_ID}/locations/${LOCATION_ID}`);

    const savedInput = page.locator('input[placeholder="Location Name"]');
    await expect(savedInput).toHaveValue('Renamed Location', { timeout: 10000 });
});

test('description auto-saves', async ({ page, request }) => {
    const owner = await createTestUser(request, 'owner@example.com', 'pass1234');
    await seedProject(request, PROJECT_ID, owner.uid, owner.email);
    await seedLocation(request, PROJECT_ID, LOCATION_ID, LOCATION_NAME);

    await signInViaUI(page, owner.email, 'pass1234');
    await page.goto(`/project/${PROJECT_ID}/locations/${LOCATION_ID}`);

    const descInput = page.locator('textarea[placeholder*="description"]');
    await descInput.waitFor({ timeout: 10000 });
    await descInput.fill('Updated description text');

    await waitForSaved(page, 8000);
});
