import { useCallback, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';

export function useFileUpload(onUpload: (file: File) => Promise<void>) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const onUploadRef = useRef(onUpload);
    onUploadRef.current = onUpload;

    const handleClick = useCallback(() => fileInputRef.current?.click(), []);

    const handleChange = useCallback(async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsUploading(true);
        try {
            await onUploadRef.current(file);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    }, []);

    return { fileInputRef, isUploading, handleClick, handleChange };
}
