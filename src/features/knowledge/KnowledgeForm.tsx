import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../../hooks/useStore';
import { useAuth } from '../../hooks/useAuth';
import { BackLink } from '../../components/ui/BackLink';
import { Button } from '../../components/ui/Button';
import { Input, TextArea } from '../../components/ui/Input';
import { FormSection } from '../../components/ui/FormSection';
import { uploadKnowledgeImage } from '../../services/storageService';
import { X, Upload, Loader2, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import type { KnowledgeItem } from '../../types/types';

const COMMON_CATEGORIES = [
    'Camera Movement',
    'Framing and Shot Size',
    'Camera Angles',
    'Lighting',
    'Composition',
    'Lenses and Optics',
    'Color and Film Look',
    'Time and Motion',
    'In-Camera and Optical Effects',
    'Editing and Transitions',
    'Atmosphere and Weather',
    'Genre Looks',
    'Viral Looks',
    'Reference Shot',
];

interface FormProps {
    existing?: KnowledgeItem;
    isNew: boolean;
    initialId: string;
}

const KnowledgeFormContent: React.FC<FormProps> = ({ existing, isNew, initialId }) => {
    const navigate = useNavigate();
    const { saveKnowledgeItem } = useStore();
    const { user } = useAuth();

    const [itemId] = useState(initialId);
    const [title, setTitle] = useState(existing?.title || existing?.name || '');
    const [category, setCategory] = useState(() => {
        if (!existing) return COMMON_CATEGORIES[0];
        return COMMON_CATEGORIES.includes(existing.category) ? existing.category : 'Other';
    });
    const [customCategory, setCustomCategory] = useState(() => {
        if (!existing) return '';
        return COMMON_CATEGORIES.includes(existing.category) ? '' : existing.category;
    });
    const [movieName, setMovieName] = useState(existing?.movieName || '');
    const [description, setDescription] = useState(existing?.description || '');
    const [link, setLink] = useState(existing?.link || '');
    const [videoUrl, setVideoUrl] = useState(existing?.videoUrl || '');
    const [prompt, setPrompt] = useState(existing?.prompt || '');
    const [images, setImages] = useState<string[]>(existing?.images || []);
    const [isUploading, setIsUploading] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0 || !user) return;

        if (images.length + files.length > 8) {
            toast.error('Maximum of 8 images allowed.');
            return;
        }

        setIsUploading(true);
        const toastId = toast.loading('Uploading and compressing images…');
        try {
            const uploadedUrls: string[] = [];
            for (let i = 0; i < files.length; i++) {
                const url = await uploadKnowledgeImage(files[i], itemId);
                uploadedUrls.push(url);
            }
            setImages(prev => [...prev, ...uploadedUrls]);
            toast.success('Images uploaded successfully!', { id: toastId });
        } catch (error) {
            console.error('Failed to upload images', error);
            toast.error('Failed to upload some images.', { id: toastId });
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleRemoveImage = (index: number) => {
        setImages(prev => prev.filter((_, idx) => idx !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedTitle = title.trim();
        if (!trimmedTitle) {
            toast.error('Please provide a title for the knowledge item.');
            return;
        }

        const effectiveCategory = category === 'Other' ? customCategory.trim() : category;
        if (!effectiveCategory) {
            toast.error('Please specify a category.');
            return;
        }

        if (link.trim()) {
            try {
                const proto = new URL(link).protocol;
                if (proto !== 'https:' && proto !== 'http:') throw new Error();
            } catch {
                toast.error('Reference URL must be a valid link starting with http:// or https://');
                return;
            }
        }

        const itemData: KnowledgeItem = {
            id: itemId,
            title: trimmedTitle,
            name: trimmedTitle,
            category: effectiveCategory,
            description: description.trim(),
            movieName: movieName.trim() || undefined,
            link: link.trim() || undefined,
            videoUrl: videoUrl.trim() || undefined,
            prompt: prompt.trim() || undefined,
            images,
            thumbnailUrl: existing?.thumbnailUrl || (images.length > 0 ? images[0] : undefined),
            stripUrl: existing?.stripUrl,
            narrativeFunction: existing?.narrativeFunction,
            howItWorks: existing?.howItWorks,
            whenToUse: existing?.whenToUse,
            alsoKnownAs: existing?.alsoKnownAs,
            filmExamples: existing?.filmExamples,
            mistakes: existing?.mistakes,
            faq: existing?.faq,
            createdAt: existing ? existing.createdAt : Date.now(),
            updatedAt: Date.now(),
            creatorId: existing ? existing.creatorId : (user?.uid || 'anonymous'),
            creatorEmail: existing ? existing.creatorEmail : (user?.email || 'anonymous'),
        };

        try {
            await saveKnowledgeItem(itemData);
            toast.success(isNew ? 'Item added to knowledge base!' : 'Knowledge item updated!');
            navigate(isNew ? '..' : `../${itemId}`);
        } catch (error) {
            console.error('Save failed', error);
            toast.error('Failed to save knowledge item.');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-6 bg-white dark:bg-primary-950 p-6 sm:p-8 rounded-xl border border-primary-200 dark:border-primary-800/60 shadow-sm">
            <Input
                name="title"
                label="Title / Technique Name"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="e.g. Vertigo Shot (Dolly Zoom) or Chiaroscuro Lighting"
            />

            <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-primary-700 dark:text-primary-300">
                        Category
                    </label>
                    <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-white dark:bg-primary-900 border border-primary-300 dark:border-primary-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20"
                    >
                        {COMMON_CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                        <option value="Other">Other (Custom Category)</option>
                    </select>
                </div>

                {category === 'Other' && (
                    <Input
                        name="customCategory"
                        label="Custom Category"
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                        required
                        placeholder="e.g. Sound Design, Wardrobe"
                    />
                )}

                <Input
                    name="movieName"
                    label="Movie Reference (optional)"
                    value={movieName}
                    onChange={(e) => setMovieName(e.target.value)}
                    placeholder="e.g. Vertigo (1958) or Blade Runner"
                />
            </div>

            <TextArea
                name="description"
                label="Description & Notes"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Explain the visual impact, camera mechanics, or aesthetic purpose..."
            />

            <div className="grid sm:grid-cols-2 gap-4">
                <Input
                    name="link"
                    label="Reference Video Clip URL (optional)"
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                />

                <Input
                    name="videoUrl"
                    label="Direct MP4 Video URL (optional)"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://..."
                />
            </div>

            <TextArea
                name="prompt"
                label="AI Image / Storyboard Generation Prompt (optional)"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={2}
                placeholder="e.g. Dolly zoom camera effect on subject standing in hotel corridor, dramatic vertigo warping..."
            />

            <FormSection title={`Reference Stills & Images (${images.length}/8)`}>
                <div className="space-y-4">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        multiple
                        accept="image/*"
                        className="hidden"
                        disabled={isUploading || images.length >= 8}
                    />

                    {images.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {images.map((img, idx) => (
                                <div key={idx} className="relative rounded-lg overflow-hidden group aspect-video bg-primary-100 dark:bg-primary-900 border border-primary-200 dark:border-primary-800">
                                    <img src={img} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveImage(idx)}
                                        className="absolute top-1.5 right-1.5 bg-black/60 hover:bg-black/80 text-white p-1 rounded-full transition-opacity opacity-0 group-hover:opacity-100"
                                        title="Remove image"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading || images.length >= 8}
                        className="w-full justify-center"
                    >
                        {isUploading ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
                        {isUploading ? 'Uploading...' : 'Upload Reference Images'}
                    </Button>
                </div>
            </FormSection>

            <div className="flex justify-end gap-3 pt-4 border-t border-primary-100 dark:border-primary-800/60">
                <Button type="button" variant="ghost" onClick={() => navigate('..')}>
                    Cancel
                </Button>
                <Button type="submit" disabled={isUploading}>
                    <Save size={16} /> Save Item
                </Button>
            </div>
        </form>
    );
};

export const KnowledgeForm: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { knowledgeItems, knowledgeLoading, fetchKnowledgeItems } = useStore();

    useEffect(() => {
        if (id && knowledgeItems.length === 0) {
            fetchKnowledgeItems();
        }
    }, [id, fetchKnowledgeItems, knowledgeItems.length]);

    const isNew = !id;
    const existing = knowledgeItems.find(s => s.id === id);
    const [initialId] = useState(() => id || crypto.randomUUID());

    if (!isNew && !existing && knowledgeLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-24 gap-3 text-primary-400">
                <Loader2 className="animate-spin text-primary-600 dark:text-primary-400" size={36} />
                <p className="text-sm">Loading knowledge item…</p>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-6">
            <BackLink to=".." label="Cancel" />
            <h2 className="text-3xl font-bold text-primary-900 dark:text-white">
                {isNew ? 'New Knowledge Item' : 'Edit Knowledge Item'}
            </h2>
            <KnowledgeFormContent
                key={existing?.id || (isNew ? 'new' : 'loading')}
                existing={existing}
                isNew={isNew}
                initialId={initialId}
            />
        </div>
    );
};
