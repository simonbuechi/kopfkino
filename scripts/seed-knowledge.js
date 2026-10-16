#!/usr/bin/env node

/**
 * Seed Knowledge Base to Firebase
 *
 * Ingests cinematic techniques and media files from D:\dev\antigravity\temp
 * into Firebase Storage (/knowledge/...) and Cloud Firestore (/knowledge/...).
 *
 * Authentication:
 *   - Google Login (Default): Automatically opens a local browser tab to sign in with Google in 1 click!
 *   - Email/Password (Optional): --email your@email.com --password yourpass
 *
 * Usage:
 *   node scripts/seed-knowledge.js
 *   node scripts/seed-knowledge.js --limit 5  (test first 5 items)
 *   node scripts/seed-knowledge.js --dry-run
 */

import fs from 'fs';
import path from 'path';
import http from 'http';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signInWithCredential, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// 1. Load .env file
function loadEnv() {
    const envPath = path.join(projectRoot, '.env');
    if (!fs.existsSync(envPath)) return {};
    const content = fs.readFileSync(envPath, 'utf8');
    const env = {};
    for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const [key, ...rest] = trimmed.split('=');
        env[key.trim()] = rest.join('=').trim();
    }
    return env;
}

const env = loadEnv();

// 2. Parse CLI arguments
const args = process.argv.slice(2);
function getArg(flag, defaultValue = null) {
    const idx = args.indexOf(flag);
    if (idx !== -1 && idx + 1 < args.length) return args[idx + 1];
    return defaultValue;
}

const isDryRun = args.includes('--dry-run');
const skipMedia = args.includes('--skip-media');
const limit = parseInt(getArg('--limit', '0'), 10);
const sourceDir = getArg('--source', 'D:\\dev\\antigravity\\temp');
const email = getArg('--email', process.env.FIREBASE_EMAIL || '');
const password = getArg('--password', process.env.FIREBASE_PASSWORD || '');

console.log('='.repeat(65));
console.log(' Kopfkino Knowledge Base Seeder');
console.log('='.repeat(65));
console.log(`Source Directory:  ${sourceDir}`);
console.log(`Dry Run:           ${isDryRun ? 'YES (no uploads)' : 'NO'}`);
console.log(`Skip Media:        ${skipMedia ? 'YES' : 'NO'}`);
if (limit > 0) console.log(`Limit:             First ${limit} items`);
console.log('='.repeat(65));

// Verify source directory
const techniquesJsonPath = path.join(sourceDir, 'data', 'techniques.json');
if (!fs.existsSync(techniquesJsonPath)) {
    console.error(`\nError: techniques.json not found at ${techniquesJsonPath}`);
    process.exit(1);
}

const rawTechniques = JSON.parse(fs.readFileSync(techniquesJsonPath, 'utf8'));
const techniques = limit > 0 ? rawTechniques.slice(0, limit) : rawTechniques;
console.log(`Found ${rawTechniques.length} techniques total (processing ${techniques.length}).\n`);

// Initialize Firebase
const firebaseConfig = {
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Cache file to make seeding resumable
const cachePath = path.join(__dirname, '.seed-cache.json');
let cache = { uploadedMedia: {}, seededDocs: {} };
if (fs.existsSync(cachePath)) {
    try {
        cache = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
    } catch {
        // ignore invalid cache
    }
}

function saveCache() {
    fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2), 'utf8');
}

function getContentType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    switch (ext) {
        case '.webp': return 'image/webp';
        case '.jpg':
        case '.jpeg': return 'image/jpeg';
        case '.png': return 'image/png';
        case '.mp4': return 'video/mp4';
        default: return 'application/octet-stream';
    }
}

async function uploadFileIfNeeded(relPath, remoteStoragePath) {
    if (skipMedia || isDryRun) return null;
    if (cache.uploadedMedia[relPath]) return cache.uploadedMedia[relPath];

    const localFullPath = path.join(sourceDir, relPath);
    if (!fs.existsSync(localFullPath)) {
        return null;
    }

    const fileBuffer = fs.readFileSync(localFullPath);
    const contentType = getContentType(localFullPath);
    const storageRef = ref(storage, remoteStoragePath);

    await uploadBytes(storageRef, fileBuffer, { contentType });
    const downloadUrl = await getDownloadURL(storageRef);

    cache.uploadedMedia[relPath] = downloadUrl;
    saveCache();
    return downloadUrl;
}

/**
 * Recursively cleans objects and arrays to prevent Firestore unsupported undefined field errors.
 */
function deepClean(obj) {
    if (obj === undefined) return undefined;
    if (obj === null || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) {
        return obj
            .map(item => deepClean(item))
            .filter(item => item !== undefined);
    }
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
        if (value !== undefined) {
            const cleaned = deepClean(value);
            if (cleaned !== undefined) {
                result[key] = cleaned;
            }
        }
    }
    return result;
}

/**
 * Spins up a local temporary web server to authorize via Google Popup in the browser.
 */
function loginWithGoogleBrowser() {
    return new Promise((resolve, reject) => {
        const port = 8085;
        const server = http.createServer((req, res) => {
            if (req.method === 'GET' && (req.url === '/' || req.url === '/auth')) {
                res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end(`<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Authorize Kopfkino Knowledge Seeder</title>
    <script type="module">
        import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-app.js";
        import { getAuth, signInWithPopup, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-auth.js";

        const firebaseConfig = ${JSON.stringify(firebaseConfig)};
        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);
        const provider = new GoogleAuthProvider();

        const btn = document.getElementById('loginBtn');
        const status = document.getElementById('status');

        btn.onclick = async () => {
            try {
                btn.disabled = true;
                status.textContent = 'Opening Google sign-in popup...';
                const result = await signInWithPopup(auth, provider);
                const credential = GoogleAuthProvider.credentialFromResult(result);
                status.textContent = 'Authorized! Sending credentials to terminal...';

                const idToken = await result.user.getIdToken();
                const resp = await fetch('/auth-callback', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        idToken,
                        oauthIdToken: credential?.idToken || null,
                        accessToken: credential?.accessToken || null,
                        email: result.user.email
                    })
                });
                if (resp.ok) {
                    status.innerHTML = '<span style="color: #10b981; font-weight: bold; font-size: 1.1rem;">✓ Authentication successful!</span><br><br>You can close this tab now and return to your terminal to watch the upload progress.';
                    btn.style.display = 'none';
                } else {
                    status.textContent = 'Server rejected token.';
                    btn.disabled = false;
                }
            } catch (err) {
                console.error(err);
                status.textContent = 'Sign-in error: ' + err.message;
                btn.disabled = false;
            }
        };
    </script>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #0b0f19; color: #f8fafc; }
        .card { background: #131c2e; padding: 2.5rem; border-radius: 1rem; border: 1px solid #1e293b; text-align: center; max-width: 440px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.7); }
        h1 { margin-top: 0; font-size: 1.5rem; color: #fff; }
        p { color: #94a3b8; font-size: 0.875rem; line-height: 1.6; margin-bottom: 1.75rem; }
        button { background: #3b82f6; color: white; border: none; padding: 0.85rem 1.75rem; font-size: 1rem; font-weight: 600; border-radius: 0.5rem; cursor: pointer; transition: all 0.2s; display: inline-flex; align-items: center; gap: 0.6rem; margin: 0 auto; }
        button:hover { background: #2563eb; transform: translateY(-1px); }
        button:disabled { opacity: 0.5; cursor: not-allowed; }
        #status { margin-top: 1.5rem; font-size: 0.875rem; color: #cbd5e1; min-height: 2rem; }
    </style>
</head>
<body>
    <div class="card">
        <h1>Kopfkino Knowledge Seeder</h1>
        <p>Click below to sign in with your Google account and grant upload permissions to your Firebase Firestore and Storage.</p>
        <button id="loginBtn">
            <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#fff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#fff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#fff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/><path fill="#fff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>
            Sign in with Google
        </button>
        <div id="status"></div>
    </div>
</body>
</html>`);
                return;
            }

            if (req.method === 'POST' && req.url === '/auth-callback') {
                let body = '';
                req.on('data', chunk => { body += chunk; });
                req.on('end', () => {
                    try {
                        const data = JSON.parse(body);
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ ok: true }));
                        server.close();
                        resolve(data);
                    } catch (err) {
                        res.writeHead(400);
                        res.end('Bad Request');
                        server.close();
                        reject(err);
                    }
                });
                return;
            }

            res.writeHead(404);
            res.end('Not Found');
        });

        server.listen(port, '127.0.0.1', () => {
            const url = `http://localhost:${port}`;
            console.log(`\nWaiting for Google authentication in your browser...`);
            console.log(`If your browser does not open automatically, visit: ${url}\n`);
            const openCmd = process.platform === 'win32'
                ? `start "" "${url}"`
                : (process.platform === 'darwin' ? `open "${url}"` : `xdg-open "${url}"`);
            exec(openCmd, () => {});
        });

        server.on('error', (err) => {
            reject(new Error(`Failed to start local auth server on port ${port}: ${err.message}`));
        });
    });
}

async function main() {
    // Authenticate if not dry-run
    if (!isDryRun) {
        if (email && password) {
            console.log(`Authenticating with Email/Password as ${email}...`);
            try {
                await signInWithEmailAndPassword(auth, email, password);
                console.log('✓ Successfully authenticated!\n');
            } catch (err) {
                console.error('✗ Email/password authentication failed:', err.message);
                process.exit(1);
            }
        } else {
            try {
                const authData = await loginWithGoogleBrowser();
                console.log(`✓ Received Google authorization for ${authData.email}!`);
                const credential = GoogleAuthProvider.credential(
                    authData.oauthIdToken || authData.idToken,
                    authData.accessToken
                );
                await signInWithCredential(auth, credential);
                console.log(`✓ Signed in to Firebase as ${authData.email}!\n`);
            } catch (err) {
                console.error('✗ Google authentication failed:', err.message);
                process.exit(1);
            }
        }
    }

    let successCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (let i = 0; i < techniques.length; i++) {
        const item = techniques[i];
        const slug = item.slug || item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const progress = `[${i + 1}/${techniques.length}]`;

        if (cache.seededDocs[slug]) {
            console.log(`${progress} Skipped (already seeded): ${item.title}`);
            skippedCount++;
            continue;
        }

        process.stdout.write(`${progress} Processing: ${item.title}... `);

        try {
            let thumbnailUrl = item.thumbnail_url;
            let videoUrl = item.video_url;
            let stripUrl = item.strip_url;

            // 1. Upload thumbnail
            if (item.local_thumbnail_path) {
                const url = await uploadFileIfNeeded(
                    item.local_thumbnail_path,
                    `knowledge/thumbs/${slug}.webp`
                );
                if (url) thumbnailUrl = url;
            }

            // 2. Upload video
            if (item.local_video_path) {
                const url = await uploadFileIfNeeded(
                    item.local_video_path,
                    `knowledge/videos/${slug}.mp4`
                );
                if (url) videoUrl = url;
            }

            // 3. Upload strip
            if (item.local_strip_path) {
                const url = await uploadFileIfNeeded(
                    item.local_strip_path,
                    `knowledge/strips/${slug}.jpg`
                );
                if (url) stripUrl = url;
            }

            // 4. Upload film examples stills
            const filmExamples = [];
            if (item.film_examples && Array.isArray(item.film_examples)) {
                for (let fIdx = 0; fIdx < item.film_examples.length; fIdx++) {
                    const ex = item.film_examples[fIdx];
                    let stillUrl = ex.still_url;
                    if (ex.local_still_path) {
                        const ext = path.extname(ex.local_still_path) || '.jpg';
                        const url = await uploadFileIfNeeded(
                            ex.local_still_path,
                            `knowledge/stills/${slug}_${fIdx}${ext}`
                        );
                        if (url) stillUrl = url;
                    }
                    const exampleObj = {
                        film: ex.film || '',
                        description: ex.description || '',
                    };
                    if (ex.year) exampleObj.year = String(ex.year);
                    if (stillUrl) exampleObj.stillUrl = stillUrl;
                    filmExamples.push(exampleObj);
                }
            }

            // Construct KnowledgeItem
            const knowledgeDoc = {
                id: slug,
                title: item.title,
                name: item.title,
                category: item.category,
                categorySlug: item.category_slug,
                description: item.definition || '',
                alsoKnownAs: item.also_known_as || [],
                narrativeFunction: item.narrative_function || [],
                howItWorks: item.how_it_works || [],
                whenToUse: item.when_to_use || [],
                filmExamples,
                prompt: item.prompt || '',
                promptInstructions: item.prompt_instructions || [],
                mistakes: item.mistakes || [],
                faq: item.faq || [],
                thumbnailUrl: thumbnailUrl || null,
                videoUrl: videoUrl || null,
                stripUrl: stripUrl || null,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                creatorId: 'cinematic-library',
                creatorEmail: 'Cinematography Library',
            };

            // Deep clean to remove any undefined fields before sending to Firestore
            const cleanDoc = deepClean(knowledgeDoc);

            if (!isDryRun) {
                await setDoc(doc(db, 'knowledge', slug), cleanDoc);
                cache.seededDocs[slug] = true;
                saveCache();
            }

            console.log('✓ Done');
            successCount++;
        } catch (err) {
            console.log('✗ Failed');
            console.error(`  Error: ${err.message}`);
            errorCount++;
        }
    }

    console.log('\n' + '='.repeat(65));
    console.log(' Seeding Summary:');
    console.log(`   Seeded:  ${successCount}`);
    console.log(`   Skipped: ${skippedCount}`);
    console.log(`   Errors:  ${errorCount}`);
    console.log('='.repeat(65));
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
