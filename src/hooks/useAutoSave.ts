import { useCallback, useEffect, useRef } from 'react';

export function useAutoSave(saveFn: (value: string) => Promise<void>, delay: number) {
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const saveFnRef = useRef(saveFn);
    saveFnRef.current = saveFn;

    const schedule = useCallback((value: string) => {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => saveFnRef.current(value), delay);
    }, [delay]);

    useEffect(() => () => {
        if (timerRef.current) clearTimeout(timerRef.current);
    }, []);

    return schedule;
}
