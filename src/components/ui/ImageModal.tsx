import React, { useEffect } from 'react';
import { X, Download } from 'lucide-react';
import { downloadImage } from '../../services/storageService';

interface ImageModalProps {
    src: string;
    alt?: string;
    onClose: () => void;
    downloadFilename?: string;
}

export const ImageModal: React.FC<ImageModalProps> = ({ src, alt = '', onClose, downloadFilename }) => {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
            onClick={onClose}
        >
            <div className="absolute top-4 right-4 flex gap-2">
                {downloadFilename && (
                    <button
                        className="text-white hover:text-primary-300 transition-colors bg-black/50 rounded-full p-2"
                        onClick={(e) => { e.stopPropagation(); downloadImage(src, downloadFilename); }}
                        title="Download Image"
                    >
                        <Download size={24} />
                    </button>
                )}
                <button
                    className="text-white hover:text-primary-300 transition-colors bg-black/50 rounded-full p-2"
                    onClick={onClose}
                >
                    <X size={24} />
                </button>
            </div>
            <img
                src={src}
                alt={alt}
                className="max-w-full max-h-full object-contain shadow-2xl rounded-lg"
                onClick={(e) => e.stopPropagation()}
            />
        </div>
    );
};
