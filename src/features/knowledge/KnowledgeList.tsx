import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../hooks/useStore';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { Plus, Search, BookOpen, Film, Video, Calendar, Sparkles, Loader2 } from 'lucide-react';
import type { KnowledgeItem } from '../../types/types';

const INITIAL_BATCH_SIZE = 24;
const LOAD_MORE_BATCH_SIZE = 24;

export const KnowledgeList: React.FC = () => {
    const navigate = useNavigate();
    const { knowledgeItems, knowledgeLoading, fetchKnowledgeItems } = useStore();
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [visibleCount, setVisibleCount] = useState(INITIAL_BATCH_SIZE);

    const loadMoreSentinelRef = useRef<HTMLDivElement>(null);

    // Fetch on-demand on mount if not loaded yet
    useEffect(() => {
        if (knowledgeItems.length === 0) {
            fetchKnowledgeItems();
        }
    }, [fetchKnowledgeItems, knowledgeItems.length]);

    const handleSearchChange = (value: string) => {
        setSearch(value);
        setVisibleCount(INITIAL_BATCH_SIZE);
    };

    const handleCategorySelect = (cat: string) => {
        setSelectedCategory(cat);
        setVisibleCount(INITIAL_BATCH_SIZE);
    };

    // Extract unique categories and item counts
    const { categories, categoryCounts } = useMemo(() => {
        const counts: Record<string, number> = { All: knowledgeItems.length };
        const set = new Set<string>();
        knowledgeItems.forEach(item => {
            if (item.category) {
                set.add(item.category);
                counts[item.category] = (counts[item.category] || 0) + 1;
            }
        });
        return {
            categories: ['All', ...Array.from(set).sort()],
            categoryCounts: counts,
        };
    }, [knowledgeItems]);

    const filtered = useMemo(() => {
        const query = search.trim().toLowerCase();
        return knowledgeItems.filter(item => {
            // Category filter
            if (selectedCategory !== 'All' && item.category !== selectedCategory) {
                return false;
            }
            // Search filter
            if (!query) return true;
            const title = (item.title || item.name || '').toLowerCase();
            const desc = (item.description || '').toLowerCase();
            const cat = (item.category || '').toLowerCase();
            const movie = (item.movieName || '').toLowerCase();
            const aka = (item.alsoKnownAs || []).some(a => a.toLowerCase().includes(query));
            const films = (item.filmExamples || []).some(f => f.film.toLowerCase().includes(query));

            return title.includes(query) || desc.includes(query) || cat.includes(query) || movie.includes(query) || aka || films;
        });
    }, [knowledgeItems, search, selectedCategory]);

    const visibleItems = useMemo(() => {
        return filtered.slice(0, visibleCount);
    }, [filtered, visibleCount]);

    const hasMore = visibleCount < filtered.length;

    // Automatic infinite scroll using IntersectionObserver
    useEffect(() => {
        if (!hasMore) return;
        const sentinel = loadMoreSentinelRef.current;
        if (!sentinel) return;

        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                setVisibleCount(prev => Math.min(prev + LOAD_MORE_BATCH_SIZE, filtered.length));
            }
        }, { rootMargin: '300px' });

        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [hasMore, filtered.length]);

    return (
        <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            <PageHeader
                title="Knowledge Base"
                actions={
                    <Button onClick={() => navigate('new')}>
                        <Plus size={18} /> Add Knowledge Item
                    </Button>
                }
            />

            {/* Search and Category Filters */}
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <div className="relative w-full max-w-md">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-primary-400 dark:text-primary-600">
                            <Search size={18} />
                        </span>
                        <input
                            type="text"
                            placeholder="Search techniques, films, keywords..."
                            value={search}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 text-sm bg-white dark:bg-primary-950 border border-primary-300 dark:border-primary-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20 dark:focus:ring-primary-400/20 focus:border-primary-600 dark:focus:border-primary-400 transition-colors"
                        />
                    </div>

                    {!knowledgeLoading && knowledgeItems.length > 0 && (
                        <div className="text-xs text-primary-500 font-medium whitespace-nowrap">
                            Showing <span className="font-semibold text-primary-700 dark:text-primary-300">{visibleItems.length}</span> of <span className="font-semibold text-primary-700 dark:text-primary-300">{filtered.length}</span> items
                        </div>
                    )}
                </div>

                {categories.length > 2 && (
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                        {categories.map((cat) => {
                            const isSelected = selectedCategory === cat;
                            const count = categoryCounts[cat];
                            return (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => handleCategorySelect(cat)}
                                    className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors flex items-center gap-1.5 ${
                                        isSelected
                                            ? 'bg-primary-900 text-white dark:bg-primary-100 dark:text-primary-900 shadow-sm'
                                            : 'bg-primary-100 dark:bg-primary-900/60 text-primary-600 dark:text-primary-400 hover:bg-primary-200 dark:hover:bg-primary-800'
                                    }`}
                                >
                                    <span>{cat}</span>
                                    {count !== undefined && (
                                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full leading-tight ${
                                            isSelected
                                                ? 'bg-white/20 text-white dark:bg-primary-900/20 dark:text-primary-900 font-semibold'
                                                : 'bg-primary-200/70 dark:bg-primary-800/80 text-primary-500 dark:text-primary-400'
                                        }`}>
                                            {count}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Loading State */}
            {knowledgeLoading && knowledgeItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-primary-400">
                    <Loader2 className="animate-spin text-primary-600 dark:text-primary-400" size={36} />
                    <p className="text-sm">Loading knowledge base reference library…</p>
                </div>
            ) : filtered.length === 0 ? (
                <EmptyState
                    icon={<BookOpen size={48} />}
                    message={search || selectedCategory !== 'All' ? 'No items found' : 'Knowledge Base is empty'}
                    description={
                        search || selectedCategory !== 'All'
                            ? 'Try adjusting your search query or selected category.'
                            : 'Add cinematic techniques, framing guides, or reference shots to your knowledge base.'
                    }
                    action={
                        !search && selectedCategory === 'All' ? (
                            <Button onClick={() => navigate('new')}>
                                <Plus size={18} /> Add your first item
                            </Button>
                        ) : undefined
                    }
                />
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {visibleItems.map((item: KnowledgeItem) => {
                            const title = item.title || item.name || 'Untitled Item';
                            const coverImage = item.thumbnailUrl || (item.images && item.images.length > 0 ? item.images[0] : '') || (item.filmExamples && item.filmExamples[0]?.stillUrl ? item.filmExamples[0].stillUrl : '');
                            const hasVideo = !!item.videoUrl;
                            const date = new Date(item.createdAt).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                            });

                            return (
                                <Card
                                    key={item.id}
                                    hoverable
                                    onClick={() => navigate(item.id)}
                                    className="flex flex-col h-full !p-0 group relative overflow-hidden"
                                >
                                    <div className="aspect-video bg-primary-100 dark:bg-primary-900 border-b border-primary-200 dark:border-primary-800 flex items-center justify-center overflow-hidden relative">
                                        {coverImage ? (
                                            <img
                                                src={coverImage}
                                                alt={title}
                                                loading="lazy"
                                                decoding="async"
                                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                            />
                                        ) : (
                                            <Film size={32} className="text-primary-300 dark:text-primary-700" />
                                        )}

                                        {hasVideo && (
                                            <span className="absolute top-2 right-2 bg-black/60 text-white p-1 rounded-md backdrop-blur-sm shadow-sm" title="Video clip available">
                                                <Video size={14} />
                                            </span>
                                        )}

                                        {item.prompt && (
                                            <span className="absolute bottom-2 left-2 bg-primary-900/80 text-white text-[10px] font-medium px-1.5 py-0.5 rounded flex items-center gap-1 backdrop-blur-sm">
                                                <Sparkles size={10} /> AI Prompt
                                            </span>
                                        )}
                                    </div>

                                    <div className="p-5 flex flex-col flex-grow gap-2.5">
                                        <div className="flex justify-between items-start gap-2">
                                            <h3 className="font-bold text-base text-primary-900 dark:text-white group-hover:text-primary-700 dark:group-hover:text-primary-300 transition-colors line-clamp-1">
                                                {title}
                                            </h3>
                                            <Badge color="primary" className="shrink-0 text-[10px] py-0.5 px-2 max-w-[120px] truncate">
                                                {item.category}
                                            </Badge>
                                        </div>

                                        {item.movieName && (
                                            <div className="text-xs font-medium text-primary-600 dark:text-primary-300 truncate">
                                                Ref: {item.movieName}
                                            </div>
                                        )}

                                        <p className="text-xs text-primary-500 dark:text-primary-400 line-clamp-2 flex-grow">
                                            {item.description || 'No description available.'}
                                        </p>

                                        <div className="pt-3 border-t border-primary-100 dark:border-primary-800/60 flex items-center justify-between text-[11px] text-primary-400">
                                            <span className="truncate max-w-[120px]">
                                                {item.creatorEmail ? item.creatorEmail : 'Library'}
                                            </span>
                                            <span className="flex items-center gap-1 shrink-0">
                                                <Calendar size={11} />
                                                {date}
                                            </span>
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>

                    {/* Infinite Scroll Sentinel / Load More */}
                    {hasMore && (
                        <div ref={loadMoreSentinelRef} className="pt-6 pb-12 flex justify-center">
                            <Button
                                variant="secondary"
                                onClick={() => setVisibleCount(prev => Math.min(prev + LOAD_MORE_BATCH_SIZE, filtered.length))}
                                className="gap-2"
                            >
                                Load More Techniques ({filtered.length - visibleItems.length} remaining)
                            </Button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};
