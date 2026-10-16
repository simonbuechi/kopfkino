import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../../hooks/useStore';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import { BackLink } from '../../components/ui/BackLink';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { FormSection } from '../../components/ui/FormSection';
import { ImageModal } from '../../components/ui/ImageModal';
import { Edit3, Trash2, ExternalLink, Film, User, Calendar, Copy, Check, Sparkles, AlertTriangle, HelpCircle, Loader2 } from 'lucide-react';
import { isSafeUrl } from '../../utils/url';
import toast from 'react-hot-toast';

export const KnowledgeDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { knowledgeItems, knowledgeLoading, fetchKnowledgeItems, deleteKnowledgeItem } = useStore();
    const { confirm, confirmDialog } = useConfirmDialog();

    useEffect(() => {
        if (knowledgeItems.length === 0) {
            fetchKnowledgeItems();
        }
    }, [fetchKnowledgeItems, knowledgeItems.length]);

    const item = knowledgeItems.find(s => s.id === id);

    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [modalImage, setModalImage] = useState<string | null>(null);
    const [copiedPrompt, setCopiedPrompt] = useState(false);

    if (!item) {
        if (knowledgeLoading) {
            return (
                <div className="flex flex-col items-center justify-center py-24 gap-3 text-primary-400">
                    <Loader2 className="animate-spin text-primary-600 dark:text-primary-400" size={36} />
                    <p className="text-sm">Loading knowledge item…</p>
                </div>
            );
        }
        return (
            <div className="space-y-6 max-w-4xl mx-auto p-6">
                <BackLink to=".." label="Back to Knowledge" />
                <div className="bg-white dark:bg-primary-950 p-8 text-center rounded-xl border border-primary-200 dark:border-primary-800">
                    <p className="text-primary-500">Knowledge item not found.</p>
                </div>
            </div>
        );
    }

    const title = item.title || item.name || 'Untitled Item';
    const allImages = [
        ...(item.images || []),
        ...(item.filmExamples?.map(f => f.stillUrl).filter((url): url is string => !!url) || []),
        ...(item.thumbnailUrl ? [item.thumbnailUrl] : [])
    ];
    // Remove duplicates
    const uniqueImages = Array.from(new Set(allImages));
    const activeImage = uniqueImages[activeImageIndex] || '';

    const handleDelete = async () => {
        if (await confirm('Are you sure you want to delete this item from the knowledge base?', {
            title: 'Delete Knowledge Item',
            confirmLabel: 'Delete',
            danger: true
        })) {
            await deleteKnowledgeItem(item.id);
            navigate('..');
        }
    };

    const handleCopyPrompt = () => {
        if (!item.prompt) return;
        navigator.clipboard.writeText(item.prompt);
        setCopiedPrompt(true);
        toast.success('AI prompt copied to clipboard!');
        setTimeout(() => setCopiedPrompt(false), 2500);
    };

    const dateStr = new Date(item.createdAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return (
        <div className="space-y-8 max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
            <div className="flex justify-between items-center">
                <BackLink to=".." label="Back to Knowledge Base" />
            </div>

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start gap-4 pb-6 border-b border-primary-200 dark:border-primary-800/60">
                <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                        <h1 className="text-3xl sm:text-4xl font-bold text-primary-900 dark:text-white leading-tight">
                            {title}
                        </h1>
                        <Badge color="primary" className="text-sm py-1 px-3">
                            {item.category}
                        </Badge>
                        {item.movieName && (
                            <span className="text-sm text-primary-500 dark:text-primary-400 font-medium">
                                • {item.movieName}
                            </span>
                        )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-primary-400">
                        <span className="flex items-center gap-1.5">
                            <User size={14} />
                            <span>{item.creatorEmail || 'Cinematography Library'}</span>
                        </span>
                        <span className="hidden sm:inline text-primary-300 dark:text-primary-700">•</span>
                        <span className="flex items-center gap-1.5">
                            <Calendar size={14} />
                            {dateStr}
                        </span>
                        {item.alsoKnownAs && item.alsoKnownAs.length > 0 && (
                            <>
                                <span className="hidden sm:inline text-primary-300 dark:text-primary-700">•</span>
                                <span className="italic">AKA: {item.alsoKnownAs.join(', ')}</span>
                            </>
                        )}
                    </div>
                </div>
                <div className="flex gap-3 shrink-0">
                    <Button variant="secondary" size="sm" onClick={() => navigate('edit')}>
                        <Edit3 size={16} /> Edit
                    </Button>
                    <Button variant="danger" size="sm" onClick={handleDelete}>
                        <Trash2 size={16} /> Delete
                    </Button>
                </div>
            </div>

            {/* Top Media Showcase */}
            <div className="grid md:grid-cols-2 gap-8 items-start">
                {/* Left Side: Video Player or Primary Image */}
                <div className="space-y-4">
                    {item.videoUrl ? (
                        <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-md border border-primary-200 dark:border-primary-800">
                            <video
                                src={item.videoUrl}
                                autoPlay
                                loop
                                muted
                                playsInline
                                controls
                                className="w-full h-full object-cover"
                            />
                        </div>
                    ) : activeImage ? (
                        <div className="aspect-video bg-primary-100 dark:bg-primary-900 rounded-xl border border-primary-200 dark:border-primary-800/60 flex items-center justify-center overflow-hidden relative group">
                            <img
                                src={activeImage}
                                alt={title}
                                className="w-full h-full object-cover cursor-pointer transition-opacity hover:opacity-95"
                                onClick={() => setModalImage(activeImage)}
                            />
                            <div className="absolute bottom-3 right-3 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                CLICK TO ZOOM
                            </div>
                        </div>
                    ) : (
                        <div className="aspect-video bg-primary-100 dark:bg-primary-900 rounded-xl border border-primary-200 dark:border-primary-800/60 flex items-center justify-center">
                            <Film size={48} className="text-primary-300 dark:text-primary-700" />
                        </div>
                    )}

                    {/* Image Thumbnails Strip if images exist */}
                    {uniqueImages.length > 1 && (
                        <div className="grid grid-cols-4 gap-2.5">
                            {uniqueImages.map((img, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => {
                                        setActiveImageIndex(idx);
                                        setModalImage(img);
                                    }}
                                    className={`aspect-video rounded-lg overflow-hidden border-2 bg-primary-100 dark:bg-primary-900 transition-all ${
                                        activeImageIndex === idx ? 'border-primary-500 scale-95 shadow-sm' : 'border-transparent opacity-70 hover:opacity-100'
                                    }`}
                                >
                                    <img src={img} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right Side: Overview & Narrative Function */}
                <div className="flex flex-col gap-6">
                    <FormSection title="Definition & Overview">
                        <p className="text-primary-700 dark:text-primary-300 whitespace-pre-wrap leading-relaxed text-sm">
                            {item.description || 'No description provided.'}
                        </p>
                    </FormSection>

                    {item.narrativeFunction && item.narrativeFunction.length > 0 && (
                        <FormSection title="Narrative Function & Psychology">
                            <ul className="list-disc list-inside space-y-2 text-sm text-primary-700 dark:text-primary-300">
                                {item.narrativeFunction.map((func, i) => (
                                    <li key={i} className="leading-relaxed">{func}</li>
                                ))}
                            </ul>
                        </FormSection>
                    )}

                    {item.link && isSafeUrl(item.link) && (
                        <FormSection title="External Video Reference">
                            <a
                                href={item.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-primary-100 dark:bg-primary-800 hover:bg-primary-200 dark:hover:bg-primary-700 text-primary-800 dark:text-primary-200 transition-colors border border-primary-200 dark:border-primary-700"
                            >
                                <ExternalLink size={16} />
                                Watch Reference Clip
                            </a>
                        </FormSection>
                    )}
                </div>
            </div>

            {/* Frame Breakdown Strip (if available) */}
            {item.stripUrl && (
                <div className="bg-white dark:bg-primary-950 p-6 rounded-xl border border-primary-200 dark:border-primary-800/60 space-y-3">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-primary-500">
                        Frame-by-Frame Breakdown Strip
                    </h3>
                    <div
                        className="overflow-x-auto rounded-lg border border-primary-200 dark:border-primary-800 cursor-pointer"
                        onClick={() => setModalImage(item.stripUrl || null)}
                    >
                        <img src={item.stripUrl} alt="Frame breakdown strip" className="w-full h-auto min-w-[600px] object-contain" />
                    </div>
                </div>
            )}

            {/* How It Works & When To Use */}
            {((item.howItWorks && item.howItWorks.length > 0) || (item.whenToUse && item.whenToUse.length > 0)) && (
                <div className="grid md:grid-cols-2 gap-8">
                    {item.howItWorks && item.howItWorks.length > 0 && (
                        <div className="bg-white dark:bg-primary-950 p-6 rounded-xl border border-primary-200 dark:border-primary-800/60 space-y-3">
                            <h3 className="text-base font-bold text-primary-900 dark:text-white">
                                How It Works & Camera Setup
                            </h3>
                            <ul className="list-disc list-inside space-y-2 text-sm text-primary-700 dark:text-primary-300">
                                {item.howItWorks.map((step, idx) => (
                                    <li key={idx} className="leading-relaxed">{step}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {item.whenToUse && item.whenToUse.length > 0 && (
                        <div className="bg-white dark:bg-primary-950 p-6 rounded-xl border border-primary-200 dark:border-primary-800/60 space-y-3">
                            <h3 className="text-base font-bold text-primary-900 dark:text-white">
                                When to Use (and When to Avoid)
                            </h3>
                            <ul className="list-disc list-inside space-y-2 text-sm text-primary-700 dark:text-primary-300">
                                {item.whenToUse.map((tip, idx) => (
                                    <li key={idx} className="leading-relaxed">{tip}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}

            {/* Film Examples */}
            {item.filmExamples && item.filmExamples.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-primary-900 dark:text-white">
                        Movie & Cinematography References
                    </h2>
                    <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
                        {item.filmExamples.map((ref, idx) => (
                            <div
                                key={idx}
                                className="bg-white dark:bg-primary-950 rounded-xl border border-primary-200 dark:border-primary-800/60 overflow-hidden flex flex-col group"
                            >
                                {ref.stillUrl ? (
                                    <div
                                        className="aspect-video bg-primary-100 dark:bg-primary-900 overflow-hidden cursor-pointer"
                                        onClick={() => setModalImage(ref.stillUrl || null)}
                                    >
                                        <img
                                            src={ref.stillUrl}
                                            alt={ref.film}
                                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                        />
                                    </div>
                                ) : (
                                    <div className="aspect-video bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                                        <Film size={28} className="text-primary-300 dark:text-primary-700" />
                                    </div>
                                )}
                                <div className="p-4 flex flex-col gap-1.5 flex-grow">
                                    <div className="flex justify-between items-baseline gap-2">
                                        <span className="font-bold text-sm text-primary-900 dark:text-white">
                                            {ref.film}
                                        </span>
                                        {ref.year && (
                                            <span className="text-xs text-primary-400">
                                                ({ref.year})
                                            </span>
                                        )}
                                    </div>
                                    {ref.description && (
                                        <p className="text-xs text-primary-600 dark:text-primary-400 leading-relaxed">
                                            {ref.description}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* AI Prompt Snippet */}
            {item.prompt && (
                <div className="bg-primary-50 dark:bg-primary-900/40 p-6 rounded-xl border border-primary-200 dark:border-primary-800 space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-primary-900 dark:text-white font-bold text-sm">
                            <Sparkles size={16} className="text-amber-500" />
                            AI Image & Storyboard Prompt Formula
                        </div>
                        <Button variant="secondary" size="sm" onClick={handleCopyPrompt} className="gap-1.5 text-xs">
                            {copiedPrompt ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                            {copiedPrompt ? 'Copied!' : 'Copy Prompt'}
                        </Button>
                    </div>
                    <div className="bg-white dark:bg-primary-950 p-4 rounded-lg border border-primary-200 dark:border-primary-800 text-xs font-mono text-primary-800 dark:text-primary-200 leading-relaxed break-words">
                        {item.prompt}
                    </div>
                    {item.promptInstructions && item.promptInstructions.length > 0 && (
                        <p className="text-xs text-primary-500 dark:text-primary-400">
                            Tip: {item.promptInstructions.join(' ')}
                        </p>
                    )}
                </div>
            )}

            {/* Common Mistakes */}
            {item.mistakes && item.mistakes.length > 0 && (
                <div className="bg-amber-500/5 dark:bg-amber-500/10 p-6 rounded-xl border border-amber-500/20 space-y-3">
                    <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 font-bold text-sm">
                        <AlertTriangle size={16} />
                        Common Traps & Mistakes
                    </div>
                    <ul className="list-disc list-inside space-y-1.5 text-xs text-amber-900 dark:text-amber-200">
                        {item.mistakes.map((m, i) => (
                            <li key={i} className="leading-relaxed">{m}</li>
                        ))}
                    </ul>
                </div>
            )}

            {/* FAQs */}
            {item.faq && item.faq.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-lg font-bold text-primary-900 dark:text-white">
                        <HelpCircle size={20} />
                        Frequently Asked Questions
                    </div>
                    <div className="space-y-3">
                        {item.faq.map((q, idx) => (
                            <div key={idx} className="bg-white dark:bg-primary-950 p-5 rounded-xl border border-primary-200 dark:border-primary-800/60 space-y-1.5">
                                <h4 className="font-semibold text-sm text-primary-900 dark:text-white">
                                    {q.question}
                                </h4>
                                <p className="text-xs text-primary-600 dark:text-primary-400 leading-relaxed">
                                    {q.answer}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Fullscreen Zoom Modal */}
            {modalImage && (
                <ImageModal
                    src={modalImage}
                    alt={title}
                    onClose={() => setModalImage(null)}
                    downloadFilename={`knowledge-${title.toLowerCase().replace(/\s+/g, '-')}.png`}
                />
            )}

            {confirmDialog}
        </div>
    );
};
