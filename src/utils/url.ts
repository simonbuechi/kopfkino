/**
 * Returns true for http: and https: URLs; false for empty strings, invalid URLs,
 * and any other scheme (javascript:, data:, etc.).
 */
export function isSafeUrl(val: string): boolean {
    if (!val) return true;
    try {
        const { protocol } = new URL(val);
        return protocol === 'http:' || protocol === 'https:';
    } catch {
        return false;
    }
}
