'use client';

import { useState } from 'react';
import { db } from '@/lib/db';
import { Plus, Book, Type, MessageSquare } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { motion } from 'framer-motion';
import { useT } from '@/lib/useTranslations';

export default function AddPage() {
    const router = useRouter();
    const t = useT('addTerm');
    const [formData, setFormData] = useState({
        content: '',
        definition: '',
        context: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.content.trim()) return;

        const id = uuidv4();
        const timestamp = Date.now();

        await db.transaction('rw', db.terms, db.progress, async () => {
            await db.terms.add({
                id,
                content: formData.content,
                definition: formData.definition,
                context: formData.context,
                createdAt: timestamp,
            });

            await db.progress.add({
                termId: id,
                nextReview: timestamp,
                interval: 0,
                repetition: 0,
                efactor: 2.5,
                history: []
            });
        });

        router.push('/');
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto space-y-10 pt-10"
        >
            <div className="space-y-3 text-center">
                <h1 className="text-4xl font-extrabold tracking-tight">
                    {t.rich('title', {
                        glow: (chunks) => <span className="text-glow">{chunks}</span>
                    })}
                </h1>
                <p className="text-zinc-500 font-medium tracking-wide uppercase text-xs">{t('subtitle')}</p>
            </div>

            <form onSubmit={handleSubmit} className="glass-card p-8 space-y-8 relative overflow-hidden">
                {/* Decorative corner */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl -z-10" />

                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-bold text-zinc-300">
                            <Type size={16} className="text-blue-400" />
                            {t('fields.term.label')}
                        </label>
                        <input
                            type="text"
                            autoFocus
                            required
                            className="glass-input text-xl font-bold py-4"
                            placeholder={t('fields.term.placeholder')}
                            value={formData.content}
                            onChange={e => setFormData(prev => ({ ...prev, content: e.target.value }))}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-bold text-zinc-300">
                            <Book size={16} className="text-indigo-400" />
                            {t('fields.definition.label')}
                        </label>
                        <textarea
                            className="glass-input min-h-[120px] resize-none"
                            placeholder={t('fields.definition.placeholder')}
                            value={formData.definition}
                            onChange={e => setFormData(prev => ({ ...prev, definition: e.target.value }))}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-bold text-zinc-300">
                            <MessageSquare size={16} className="text-purple-400" />
                            {t('fields.context.label')}
                        </label>
                        <textarea
                            className="glass-input min-h-[100px] resize-none"
                            placeholder={t('fields.context.placeholder')}
                            value={formData.context}
                            onChange={e => setFormData(prev => ({ ...prev, context: e.target.value }))}
                        />
                    </div>
                </div>

                <div className="pt-4">
                    <button
                        type="submit"
                        className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center gap-2 hover:shadow-[0_0_25px_rgba(59,130,246,0.3)] transition-all active:scale-[0.98]"
                    >
                        <Plus size={22} strokeWidth={3} />
                        {t('submit')}
                    </button>
                </div>
            </form>
        </motion.div>
    );
}
