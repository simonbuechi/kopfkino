import { test, expect } from '@playwright/test';
import { clearEmulator, createTestUser, signInViaUI, signOutViaUI } from './helpers';

test.beforeEach(async ({ request }) => {
    await clearEmulator(request);
});

test('register new account redirects to app', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: 'Register' }).click();

    await page.locator('input[type="email"]').fill('new@example.com');
    const passwords = page.locator('input[type="password"]');
    await passwords.nth(0).fill('password123');
    await passwords.nth(1).fill('password123');
    await page.locator('button[type="submit"]').click();

    await page.waitForURL(/^(?!.*login).*$/, { timeout: 10000 });
    await expect(page).not.toHaveURL(/login/);
});

test('sign in with existing account', async ({ page, request }) => {
    await createTestUser(request, 'user@example.com', 'password123');
    await signInViaUI(page, 'user@example.com', 'password123');

    await expect(page).not.toHaveURL(/login/);
});

test('sign out returns to login page', async ({ page, request }) => {
    await createTestUser(request, 'user@example.com', 'password123');
    await signInViaUI(page, 'user@example.com', 'password123');
    await signOutViaUI(page);

    await expect(page).toHaveURL(/login/);
});

test('unauthenticated visit redirects to login', async ({ page }) => {
    await page.goto('/');
    await page.waitForURL(/login/, { timeout: 5000 });
    await expect(page).toHaveURL(/login/);
});

test('wrong password shows error message', async ({ page, request }) => {
    await createTestUser(request, 'user@example.com', 'correctpass');

    await page.goto('/login');
    await page.locator('input[type="email"]').fill('user@example.com');
    await page.locator('input[type="password"]').fill('wrongpass');
    await page.locator('button[type="submit"]').click();

    await expect(page.locator('p.text-red-400')).toBeVisible({ timeout: 5000 });
    await expect(page).toHaveURL(/login/);
});

test('mismatched passwords in register shows error', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: 'Register' }).click();

    await page.locator('input[type="email"]').fill('new@example.com');
    const passwords = page.locator('input[type="password"]');
    await passwords.nth(0).fill('password123');
    await passwords.nth(1).fill('different456');
    await page.locator('button[type="submit"]').click();

    await expect(page.getByText(/passwords do not match/i)).toBeVisible({ timeout: 3000 });
    await expect(page).toHaveURL(/login/);
});
