import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { Button } from '../../components/ui/Button';

interface SetupModalProps {
    initial?: { name: string; description: string };
    onConfirm: (name: string, description: string) => void;
    onClose: () => void;
}

export const SetupModal: React.FC<SetupModalProps> = ({ initial, onConfirm, onClose }) => {
    const [name, setName] = useState(initial?.name ?? '');
    const [description, setDescription] = useState(initial?.description ?? '');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [onClose]);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!name.trim()) return;
        onConfirm(name.trim(), description.trim());
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="bg-white dark:bg-primary-900 rounded-xl shadow-2xl w-full max-w-md border border-primary-200 dark:border-primary-700"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between px-6 py-4 border-b border-primary-100 dark:border-primary-800">
                    <h2 className="font-semibold text-primary-900 dark:text-white text-base">
                        {initial ? 'Edit Setup' : 'New Setup'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-primary-400 hover:text-primary-700 dark:hover:text-primary-200 p-1 rounded-md transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-primary-700 dark:text-primary-300 mb-1 uppercase tracking-wider">
                            Name *
                        </label>
                        <input
                            ref={inputRef}
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="Setup name"
                            className="w-full rounded-lg border border-primary-300 dark:border-primary-700 bg-white dark:bg-primary-950 px-3 py-2 text-sm text-primary-900 dark:text-primary-100 focus:outline-none focus:ring-2 focus:ring-primary-600/20 dark:focus:ring-primary-400/20 focus:border-primary-600 dark:focus:border-primary-400 transition-colors"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-primary-700 dark:text-primary-300 mb-1 uppercase tracking-wider">
                            Description
                        </label>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Optional description"
                            rows={3}
                            className="w-full rounded-lg border border-primary-300 dark:border-primary-700 bg-white dark:bg-primary-950 px-3 py-2 text-sm text-primary-900 dark:text-primary-100 focus:outline-none focus:ring-2 focus:ring-primary-600/20 dark:focus:ring-primary-400/20 focus:border-primary-600 dark:focus:border-primary-400 transition-colors resize-none"
                        />
                    </div>
                    <div className="flex gap-2 justify-end pt-2">
                        <Button type="button" variant="secondary" size="sm" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" size="sm" disabled={!name.trim()}>
                            {initial ? 'Save' : 'Create Setup'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};
