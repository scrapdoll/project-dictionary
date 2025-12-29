'use client';

import { useState } from 'react';
import { db, type Term, type Progress } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { Search, Calendar, History, Trash2, ChevronRight, Zap, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function LibraryPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTermId, setSelectedTermId] = useState<string | null>(null);

    const data = useLiveQuery(async () => {
        const terms = await db.terms.toArray();
        const progress = await db.progress.toArray();

        return terms.map(t => ({
            ...t,
            progress: progress.find(p => p.termId === t.id)
        }));
    });

    const filteredData = data?.filter(item =>
        item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.definition.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this term? This action cannot be undone.')) {
            await db.transaction('rw', db.terms, db.progress, async () => {
                await db.terms.delete(id);
                await db.progress.delete(id);
            });
            if (selectedTermId === id) setSelectedTermId(null);
        }
    };

    const formatDate = (ts: number | undefined) => {
        if (!ts) return 'N/A';
        return new Date(ts).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getMastery = (reps: number = 0, interval: number = 0) => {
        // Arbitrary mastery level based on repetitions and interval
        if (interval > 30) return { label: 'Mastered', color: 'text-emerald-400', bg: 'bg-emerald-500/10' };
        if (reps > 3) return { label: 'Learned', color: 'text-blue-400', bg: 'bg-blue-500/10' };
        if (reps > 0) return { label: 'Learning', color: 'text-amber-400', bg: 'bg-amber-500/10' };
        return { label: 'New', color: 'text-zinc-500', bg: 'bg-zinc-500/10' };
    };

    return (
        <div className="space-y-8 pb-12">
            <div className="space-y-3">
                <h1 className="text-4xl font-extrabold tracking-tight">Library <span className="text-glow">Engine</span></h1>
                <p className="text-zinc-500 font-medium tracking-wide uppercase text-xs">Manage and analyze your knowledge base</p>
            </div>

            <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 transition-colors group-focus-within:text-blue-400" size={20} />
                <input
                    type="text"
                    placeholder="Search within lexicon..."
                    className="glass-input pl-12"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            <div className="space-y-4">
                {filteredData?.map((item) => {
                    const isSelected = selectedTermId === item.id;
                    const mastery = getMastery(item.progress?.repetition, item.progress?.interval);
                    const lastReview = item.progress?.history?.length
                        ? item.progress.history[item.progress.history.length - 1].date
                        : null;

                    return (
                        <motion.div
                            layout
                            key={item.id}
                            onClick={() => setSelectedTermId(isSelected ? null : item.id)}
                            className={cn(
                                "glass-card overflow-hidden cursor-pointer transition-all duration-300",
                                isSelected ? "ring-2 ring-blue-500/40" : "hover:bg-white/[0.07]"
                            )}
                        >
                            <div className="p-6 flex items-center justify-between">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-xl font-bold">{item.content}</h3>
                                        <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider", mastery.bg, mastery.color)}>
                                            {mastery.label}
                                        </span>
                                    </div>
                                    <p className="text-zinc-400 text-sm line-clamp-1">{item.definition}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right hidden md:block">
                                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Next Review</p>
                                        <p className="text-xs font-medium text-zinc-300">{formatDate(item.progress?.nextReview)}</p>
                                    </div>
                                    <ChevronRight size={20} className={cn("text-zinc-600 transition-transform duration-300", isSelected && "rotate-90")} />
                                </div>
                            </div>

                            <AnimatePresence>
                                {isSelected && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="border-t border-white/5 bg-black/20"
                                    >
                                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-6">
                                                <div className="space-y-2">
                                                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Definition</p>
                                                    <p className="text-zinc-200 leading-relaxed">{item.definition || "No definition provided."}</p>
                                                </div>
                                                {item.context && (
                                                    <div className="space-y-2">
                                                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Context</p>
                                                        <p className="text-zinc-400 italic text-sm">"{item.context}"</p>
                                                    </div>
                                                )}
                                                <button
                                                    onClick={(e) => handleDelete(item.id, e)}
                                                    className="flex items-center gap-2 text-red-400 text-sm font-bold hover:text-red-300 transition-colors pt-4"
                                                >
                                                    <Trash2 size={16} /> Delete from Neural Base
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="glass-card p-4 space-y-2 border-white/10">
                                                    <div className="flex items-center gap-2 text-blue-400">
                                                        <Calendar size={14} />
                                                        <span className="text-[10px] font-bold uppercase tracking-widest">Next Review</span>
                                                    </div>
                                                    <p className="text-sm font-bold">{formatDate(item.progress?.nextReview)}</p>
                                                </div>
                                                <div className="glass-card p-4 space-y-2 border-white/10">
                                                    <div className="flex items-center gap-2 text-indigo-400">
                                                        <History size={14} />
                                                        <span className="text-[10px] font-bold uppercase tracking-widest">Last Review</span>
                                                    </div>
                                                    <p className="text-sm font-bold">{formatDate(lastReview || undefined)}</p>
                                                </div>
                                                <div className="glass-card p-4 space-y-2 border-white/10">
                                                    <div className="flex items-center gap-2 text-purple-400">
                                                        <Zap size={14} />
                                                        <span className="text-[10px] font-bold uppercase tracking-widest">Level</span>
                                                    </div>
                                                    <p className="text-sm font-bold">{item.progress?.repetition || 0} Reps</p>
                                                </div>
                                                <div className="glass-card p-4 space-y-2 border-white/10">
                                                    <div className="flex items-center gap-2 text-emerald-400">
                                                        <Target size={14} />
                                                        <span className="text-[10px] font-bold uppercase tracking-widest">Interval</span>
                                                    </div>
                                                    <p className="text-sm font-bold">{item.progress?.interval || 0} Days</p>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    );
                })}

                {(!filteredData || filteredData.length === 0) && (
                    <div className="text-center py-20 glass-card">
                        <p className="text-zinc-500 italic">No neural patterns found matching your search.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
