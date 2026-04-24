import { useState, useCallback } from 'react';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';

interface ConfirmOptions {
    title?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    danger?: boolean;
}

export function useConfirmDialog() {
    const [pending, setPending] = useState<{
        message: string;
        options: ConfirmOptions;
        resolve: (value: boolean) => void;
    } | null>(null);

    const confirm = useCallback((message: string, options: ConfirmOptions = {}): Promise<boolean> => {
        return new Promise(resolve => setPending({ message, options, resolve }));
    }, []);

    const handleConfirm = () => {
        pending?.resolve(true);
        setPending(null);
    };

    const handleCancel = () => {
        pending?.resolve(false);
        setPending(null);
    };

    const confirmDialog = pending ? (
        <ConfirmDialog
            message={pending.message}
            title={pending.options.title}
            confirmLabel={pending.options.confirmLabel}
            cancelLabel={pending.options.cancelLabel}
            danger={pending.options.danger}
            onConfirm={handleConfirm}
            onCancel={handleCancel}
        />
    ) : null;

    return { confirm, confirmDialog };
}
