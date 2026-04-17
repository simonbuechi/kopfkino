# Testing

Kopfkino has three layers of tests. Each layer targets a different part of the stack and has different infrastructure requirements.

```
Layer 1 — Unit Tests        src/test/            Vitest + jsdom       no emulator
Layer 2 — Integration Tests src/test/            Vitest + emulator    emulator required
Layer 3 — E2E Tests         e2e/                 Playwright           emulator required
```

---

## Prerequisites

### Node / npm

All test dependencies are already in `package.json`. Run `npm install` once if you haven't already.

### Firebase CLI

Layers 2 and 3 require the Firebase emulator suite.

```bash
npm install -g firebase-tools
```

### Playwright browsers

Layer 3 requires the Chromium browser binary.

```bash
npx playwright install chromium
```

---

## Running tests

### Layer 1 — Unit tests (no emulator)

```bash
npm run test:unit       # run once
npm run test            # watch mode
npm run test:ui         # Vitest browser UI
```

### Layer 2 — Integration tests (emulator required)

Start the emulator in one terminal, then run tests in another.

```bash
# Terminal 1
firebase emulators:start --project kopfkino-test

# Terminal 2
npm run test:emulator
```

### Layer 3 — E2E tests (emulator required)

The Vite dev server is started automatically by Playwright in test mode. Only the Firebase emulator needs to be started manually.

```bash
# Terminal 1
firebase emulators:start --project kopfkino-test

# Terminal 2
npm run e2e             # headless
npm run e2e:ui          # interactive Playwright UI
npm run e2e:debug       # step-through debug mode
```

### Run everything

```bash
firebase emulators:start --project kopfkino-test &
npm run test && npm run e2e
```

---

## Project structure

```
src/
  test/
    setup.ts                     # jest-dom matchers, imported by vitest.config.ts
    emulator.ts                  # Admin app init and teardown for integration tests
    storeReducer.test.ts         # Unit — store reducer actions
    projectReducer.test.ts       # Unit — project reducer actions
    useDebounce.test.ts          # Unit — debounce hook
    sort.test.ts                 # Unit — sort comparators
    writeGuard.test.ts           # Unit — role-based write guard
    locationDetail.test.tsx      # Unit — LocationDetail component
    subscriptions.test.ts        # Unit — Firestore subscription cleanup
    firestoreRules.test.ts       # Integration — Firestore security rules
    storage.integration.test.ts  # Integration — storage service CRUD

e2e/
  helpers.ts                     # Shared E2E helpers (seed, sign-in, clear)
  auth.spec.ts                   # E2E — authentication flows
  locations.spec.ts              # E2E — location CRUD and auto-save
  sharing.spec.ts                # E2E — role-based access

src/
  context/
    reducers.ts                  # Extracted reducers (testable without React/Firebase)
  utils/
    sort.ts                      # Extracted sort comparators
    writeGuard.ts                # Extracted write-permission logic
```

### Why reducers and utils are extracted

`StoreProvider` and `ProjectContext` originally contained all logic inline. To test reducers and utilities in isolation — without mounting React components or initialising Firebase — they were extracted into separate files. The production code imports from these files unchanged; only the test layer benefits from the separation.

---

## Layer 1 — Unit tests

**Tools:** Vitest, jsdom, React Testing Library, `@testing-library/jest-dom`

**Config:** `vitest.config.ts`, `tsconfig.test.json`

These tests have no network calls, no Firebase, and no browser. They run in milliseconds.

### Fake timers

`useDebounce` and `LocationDetail` use real timers internally. Tests control time with Vitest's fake timers:

```ts
vi.useFakeTimers();
// ... render component ...
await act(async () => {
    vi.advanceTimersByTime(1000);
    await Promise.resolve();
});
vi.useRealTimers();
```

> **Do not** use `userEvent.setup({ advanceTimers })` combined with `waitFor` and fake timers — this causes a deadlock. Use `fireEvent` for input changes instead.

### Writing a new unit test

1. Create `src/test/myFeature.test.ts` (or `.tsx` for components).
2. Import the module under test directly — no mocking of Firebase needed if you target extracted utils.
3. For components that call store hooks, mock the hook:

```ts
vi.mock('../../hooks/useStore', () => ({
    useStore: () => ({
        locations: [],
        addLocation: vi.fn(),
        // ...
    }),
}));
```

4. Run with `npm run test:unit`.

### Writing a new component test

```ts
import { render, screen } from '@testing-library/react';
import { fireEvent, act } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { MyComponent } from '../../features/my/MyComponent';

vi.mock('../../hooks/useStore', () => ({ useStore: () => ({ /* ... */ }) }));
vi.mock('../../hooks/useProjects', () => ({ useProjects: () => ({ activeProjectId: 'p1' }) }));

describe('MyComponent', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it('does something', async () => {
        render(<MemoryRouter><MyComponent /></MemoryRouter>);
        fireEvent.change(screen.getByPlaceholderText('...'), { target: { value: 'new value' } });
        await act(async () => { vi.advanceTimersByTime(1000); await Promise.resolve(); });
        expect(mockFn).toHaveBeenCalled();
    });
});
```

---

## Layer 2 — Integration tests

**Tools:** Vitest, `@firebase/rules-unit-testing`, Firebase emulator (Auth port 9099, Firestore port 8080)

### Firestore rules tests (`firestoreRules.test.ts`)

Each test gets a fresh `initializeTestEnvironment` context. Tests assert that reads and writes either succeed or are denied based on the caller's auth state and role.

Pattern for a rules test:

```ts
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';

const env = await initializeTestEnvironment({
    projectId: 'kopfkino-test',
    firestore: { rules: readFileSync('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8080 },
});

// Authenticated context for a specific user
const userCtx = env.authenticatedContext('uid-alice');

// Unauthenticated context
const anonCtx = env.unauthenticatedContext();

it('owner can read their project', async () => {
    await assertSucceeds(getDoc(doc(userCtx.firestore(), 'projects/p1')));
});

it('stranger cannot read the project', async () => {
    await assertFails(getDoc(doc(anonCtx.firestore(), 'projects/p1')));
});
```

### Adding a rules test

1. Open `src/test/firestoreRules.test.ts`.
2. Seed the required documents using `env.withSecurityRulesDisabled(async ctx => { ... })` — this bypasses rules for setup only.
3. Write `assertSucceeds` / `assertFails` assertions for the scenario.
4. Run with `npm run test:emulator`.

### Storage integration tests (`storage.integration.test.ts`)

These call the real `storage.ts` service functions against the emulator. They verify the service layer works end-to-end, not just that the rules allow the operation.

---

## Layer 3 — E2E tests

**Tools:** Playwright, Firebase emulator, Vite dev server (auto-started in `--mode test`)

**Config:** `playwright.config.ts`

The Vite server is started by Playwright via the `webServer` config with `VITE_USE_EMULATOR=true`. This causes `src/services/firebase.ts` to connect to the local emulator instead of production Firebase.

### Test isolation

Every test file uses `beforeEach` to clear all emulator state:

```ts
test.beforeEach(async ({ request }) => {
    await clearEmulator(request);
});
```

`clearEmulator` deletes all Firestore documents and all Auth accounts via the emulator's admin REST API. This guarantees each test starts from a clean slate.

### Seeding data

Helper functions in `e2e/helpers.ts` seed Firestore using the REST API with `Authorization: Bearer owner`. This header is accepted by the Firebase emulator to bypass security rules — no Admin SDK or service account is needed.

```ts
// Create a Firebase Auth user
const user = await createTestUser(request, 'alice@example.com', 'pass1234');

// Seed a project owned by that user
await seedProject(request, 'my-project', user.uid, user.email);

// Seed a location inside the project
await seedLocation(request, 'my-project', 'loc-1', 'Old Factory');

// Optionally add a second member with a specific role
await seedProject(request, 'my-project', owner.uid, owner.email, {
    [viewer.uid]: { role: 'viewer', email: viewer.email, displayName: 'Viewer' },
});
await seedProjectRef(request, viewer.uid, 'my-project', 'viewer');
```

### Signing in

```ts
await signInViaUI(page, 'alice@example.com', 'pass1234');
// page is now on '/', authenticated
```

### Waiting for auto-save

`LocationDetail` debounces writes by 1 second and then shows a "Saved" indicator. Use the `waitForSaved` helper:

```ts
await nameInput.fill('New Name');
await waitForSaved(page, 8000); // waits up to 8 s for the "Saved" text
```

### Writing a new E2E test

1. Create `e2e/myFeature.spec.ts`.
2. Use `test.beforeEach` to clear the emulator.
3. Seed only the data your test needs.
4. Sign in as the relevant user.
5. Use `page.goto('/...')` to navigate directly — no need to click through the UI to reach a page.
6. Assert with Playwright's `expect(locator).toBeVisible()` etc.

Minimal template:

```ts
import { test, expect } from '@playwright/test';
import { clearEmulator, createTestUser, seedProject, signInViaUI } from './helpers';

test.beforeEach(async ({ request }) => {
    await clearEmulator(request);
});

test('my scenario', async ({ page, request }) => {
    const user = await createTestUser(request, 'user@example.com', 'pass1234');
    await seedProject(request, 'proj-1', user.uid, user.email);

    await signInViaUI(page, user.email, 'pass1234');
    await page.goto('/project/proj-1');

    await expect(page.getByText('Test Project')).toBeVisible();
});
```

---

## Emulator configuration

Ports are defined in `firebase.json`:

| Service | Port |
|---------|------|
| Auth | 9099 |
| Firestore | 8080 |
| Storage | 9199 |
| Emulator UI | 4000 |

The app connects to these ports when `VITE_USE_EMULATOR=true` is set (see `src/services/firebase.ts`). The `.env.test` file sets this variable for the Vite test mode server.

In emulator mode the app uses `memoryLocalCache` for Firestore instead of the default `persistentLocalCache`. This prevents IndexedDB from bleeding data between tests when the browser page is reused.

---

## npm scripts reference

| Script | Command | Notes |
|--------|---------|-------|
| `test` | `vitest` | Watch mode, all Vitest tests |
| `test:run` | `vitest run` | One-shot, all Vitest tests |
| `test:unit` | `vitest run --exclude '**storage.integration**' --exclude '**firestoreRules**'` | No emulator needed |
| `test:emulator` | `vitest run src/test/storage.integration.test.ts src/test/firestoreRules.test.ts` | Emulator required |
| `test:ui` | `vitest --ui` | Vitest browser UI |
| `e2e` | `playwright test` | Emulator required, Vite auto-started |
| `e2e:ui` | `playwright test --ui` | Interactive Playwright UI |
| `e2e:debug` | `playwright test --debug` | Step-through debugger |
