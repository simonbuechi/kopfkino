import React from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { Button } from './Button';

interface Props {
    title?: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    danger?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export const ConfirmDialog: React.FC<Props> = ({
    title = 'Confirm',
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    danger = true,
    onConfirm,
    onCancel,
}) => (
    <Dialog open onClose={onCancel} className="relative z-50">
        <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
            <DialogPanel className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 p-6">
                <DialogTitle className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                    {title}
                </DialogTitle>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">{message}</p>
                <div className="flex justify-end gap-3">
                    <Button variant="ghost" onClick={onCancel}>{cancelLabel}</Button>
                    <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm}>{confirmLabel}</Button>
                </div>
            </DialogPanel>
        </div>
    </Dialog>
);
