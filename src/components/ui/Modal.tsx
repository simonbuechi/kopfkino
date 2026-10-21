import React from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { X } from 'lucide-react';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: React.ReactNode;
    icon?: React.ReactNode;
    children: React.ReactNode;
    size?: ModalSize;
    className?: string;
    showCloseButton?: boolean;
}

const SIZE_CLASSES: Record<ModalSize, string> = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
};

export const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    icon,
    children,
    size = 'lg',
    className = '',
    showCloseButton = true,
}) => {
    if (!isOpen) return null;

    return (
        <Dialog open onClose={onClose} className="relative z-50">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" aria-hidden="true" />
            <div className="fixed inset-0 flex items-center justify-center p-4">
                <DialogPanel
                    className={`w-full ${SIZE_CLASSES[size]} max-h-[90vh] overflow-y-auto bg-white dark:bg-primary-900 rounded-2xl shadow-2xl border border-primary-200 dark:border-primary-800 p-6 animate-in fade-in duration-200 ${className}`}
                >
                    {title && (
                        <div className="flex items-center justify-between pb-4 border-b border-primary-100 dark:border-primary-800 sticky top-0 bg-white dark:bg-primary-900 z-10">
                            <DialogTitle className="text-lg font-bold text-primary-900 dark:text-white flex items-center gap-2">
                                {icon}
                                {title}
                            </DialogTitle>
                            {showCloseButton && (
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="text-primary-400 hover:text-primary-600 dark:hover:text-primary-200 transition-colors p-1 rounded-md cursor-pointer"
                                    aria-label="Close modal"
                                >
                                    <X size={20} />
                                </button>
                            )}
                        </div>
                    )}
                    {children}
                </DialogPanel>
            </div>
        </Dialog>
    );
};
