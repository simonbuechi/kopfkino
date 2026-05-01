import { useState, useEffect } from 'react';

const STORAGE_KEY = 'pollinations_api_key';
const RETURN_KEY = 'pollinations_return_url';
const EVENT = 'pollinations-auth-changed';

function getStoredKey() {
    return localStorage.getItem(STORAGE_KEY);
}

export function usePollinationsAuth() {
    const [apiKey, setApiKey] = useState<string | null>(getStoredKey);

    // Keep all hook instances in sync via a custom window event
    useEffect(() => {
        const sync = () => setApiKey(getStoredKey());
        window.addEventListener(EVENT, sync);
        return () => window.removeEventListener(EVENT, sync);
    }, []);

    const connect = () => {
        sessionStorage.setItem(RETURN_KEY, window.location.href);
        const params = new URLSearchParams({ redirect_uri: window.location.origin });
        const appKey = import.meta.env.VITE_POLLINATION_APP_KEY as string | undefined;
        if (appKey) params.set('client_id', appKey);
        window.location.href = `https://enter.pollinations.ai/authorize?${params}`;
    };

    const disconnect = () => {
        localStorage.removeItem(STORAGE_KEY);
        setApiKey(null);
        window.dispatchEvent(new Event(EVENT));
    };

    return { apiKey, connect, disconnect, isConnected: !!apiKey };
}

/**
 * Call synchronously before React mounts (in main.tsx).
 * HashRouter uses # for routing — if we wait for a useEffect, the router
 * will consume #api_key=... before we can read it.
 */
export function handlePollinationsCallback() {
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const key = hash.get('api_key');
    if (!key) return;

    localStorage.setItem(STORAGE_KEY, key);

    const returnUrl = sessionStorage.getItem(RETURN_KEY) || (window.location.origin + '/#/');
    sessionStorage.removeItem(RETURN_KEY);

    // Replace the URL so the router never sees #api_key=...
    // Using replace() so the OAuth redirect doesn't appear in browser history.
    window.location.replace(returnUrl);
}
