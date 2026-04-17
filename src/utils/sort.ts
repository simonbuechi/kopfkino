/** Sort comparator for documents that carry an optional `order` field. */
export function byOrder(a: { order?: number }, b: { order?: number }): number {
    return (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER);
}

/** Sort comparator for projects (newest first). */
export function byCreatedAtDesc(a: { createdAt: number }, b: { createdAt: number }): number {
    return b.createdAt - a.createdAt;
}

/** Sort comparator for schedules (most recently updated first). */
export function byUpdatedAtDesc(a: { updatedAt: number }, b: { updatedAt: number }): number {
    return b.updatedAt - a.updatedAt;
}
