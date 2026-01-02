'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { Save, AlertCircle, Bot, Globe, Key, Cpu, RefreshCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useT } from '@/lib/useTranslations';
import { LanguageSelector } from '@/components/LanguageSelector';

export default function SettingsPage() {
    const t = useT('settings');
    const currentSettings = useLiveQuery(() => db.settings.get(1));
    const [formData, setFormData] = useState({
        apiKey: '',
        apiBaseUrl: 'https://api.openai.com/v1',
        model: 'gpt-4o',
        aiEnabled: true,
    });

    const [status, setStatus] = useState<'idle' | 'saved'>('idle');

    useEffect(() => {
        if (currentSettings) {
            setFormData({
                apiKey: currentSettings.apiKey,
                apiBaseUrl: currentSettings.apiBaseUrl,
                model: currentSettings.model,
                aiEnabled: currentSettings.aiEnabled,
            });
        }
    }, [currentSettings]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        await db.settings.put({
            id: 1,
            ...formData,
            language: currentSettings?.language || 'en-US',
            xp: currentSettings?.xp || 0
        });
        setStatus('saved');
        setTimeout(() => setStatus('idle'), 2000);
    };

    const handleResetAllProgress = async () => {
        if (confirm(t('resetProgressConfirm'))) {
            await db.transaction('rw', db.progress, db.terms, async () => {
                const allTerms = await db.terms.toArray();
                await db.progress.clear();
                const now = Date.now();
                const initialProgress = allTerms.map(term => ({
                    termId: term.id,
                    nextReview: now,
                    interval: 0,
                    repetition: 0,
                    efactor: 2.5,
                    history: []
                }));
                await db.progress.bulkAdd(initialProgress);
            });
            alert(t('progressReset'));
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl mx-auto space-y-10 pt-10"
        >
            <div className="space-y-3 text-center">
                <h1 className="text-4xl font-extrabold tracking-tight">
                    {t.rich('title', {
                        glow: (chunks) => <span className="text-glow">{chunks}</span>
                    })}
                </h1>
                <p className="text-zinc-500 font-medium tracking-wide uppercase text-xs">{t('tagline')}</p>
            </div>

            <form onSubmit={handleSave} className="glass-card p-8 space-y-10">
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-4">
                        <div className={cn(
                            "p-3 rounded-xl transition-colors",
                            formData.aiEnabled ? "bg-blue-500/20 text-blue-400" : "bg-zinc-800 text-zinc-500"
                        )}>
                            <Bot size={24} />
                        </div>
                        <div>
                            <p className="font-bold">{t('neuralEngine')}</p>
                            <p className="text-xs text-zinc-500">{t('neuralEngineDescription')}</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, aiEnabled: !prev.aiEnabled }))}
                        className={cn(
                            "w-14 h-8 rounded-full transition-all relative flex items-center px-1",
                            formData.aiEnabled ? "bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.4)]" : "bg-zinc-700"
                        )}
                    >
                        <motion.div
                            animate={{ x: formData.aiEnabled ? 24 : 0 }}
                            className="w-6 h-6 bg-white rounded-full shadow-lg"
                        />
                    </button>
                </div>

                <AnimatePresence mode="wait">
                    {formData.aiEnabled && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="space-y-6 overflow-visible"
                        >
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-bold text-zinc-300">
                                    <Globe size={16} className="text-zinc-500" />
                                    {t('apiEndpoint')}
                                </label>
                                <input
                                    type="text"
                                    className="glass-input font-mono text-sm"
                                    placeholder={t('apiEndpointPlaceholder')}
                                    value={formData.apiBaseUrl}
                                    onChange={e => setFormData(prev => ({ ...prev, apiBaseUrl: e.target.value }))}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-bold text-zinc-300">
                                    <Key size={16} className="text-zinc-500" />
                                    {t('accessToken')}
                                </label>
                                <input
                                    type="password"
                                    className="glass-input font-mono text-sm"
                                    placeholder={t('accessTokenPlaceholder')}
                                    value={formData.apiKey}
                                    onChange={e => setFormData(prev => ({ ...prev, apiKey: e.target.value }))}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-bold text-zinc-300">
                                    <Cpu size={16} className="text-zinc-500" />
                                    {t('intelligenceModel')}
                                </label>
                                <input
                                    type="text"
                                    className="glass-input font-mono text-sm"
                                    placeholder={t('intelligenceModelPlaceholder')}
                                    value={formData.model}
                                    onChange={e => setFormData(prev => ({ ...prev, model: e.target.value }))}
                                />
                            </div>

                            <div className="space-y-2 relative">
                                <label className="flex items-center gap-2 text-sm font-bold text-zinc-300">
                                    <Globe size={16} className="text-zinc-500" />
                                    {t('language')}
                                </label>
                                <LanguageSelector />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="pt-6 flex flex-col items-center gap-6 border-t border-white/5">
                    <div className="text-xs text-zinc-500 flex items-center gap-2 bg-zinc-900/50 px-4 py-2 rounded-full border border-zinc-800">
                        <AlertCircle size={14} className="text-amber-500/70" />
                        {t('keysWarning')}
                    </div>
                    <button
                        type="submit"
                        className={cn(
                            "w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98]",
                            status === 'saved' ? "bg-emerald-500 text-white" : "bg-white text-black hover:bg-zinc-200"
                        )}
                    >
                        {status === 'saved' ? (
                            <>{t('done')}</>
                        ) : (
                            <>
                                <Save size={20} />
                                {t('synchronize')}
                            </>
                        )}
                    </button>

                    <div className="w-full pt-6 border-t border-white/5 space-y-4">
                        <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest text-center mb-4">{t('dataManagement')}</p>

                        <button
                            type="button"
                            onClick={async () => {
                                const { exportDatabase } = await import('@/lib/db');
                                const data = await exportDatabase();
                                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `neurolex-export-${new Date().toISOString().split('T')[0]}.json`;
                                a.click();
                                URL.revokeObjectURL(url);
                            }}
                            className="w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all bg-zinc-800 text-white hover:bg-zinc-700 active:scale-[0.98]"
                        >
                            {t('exportDictionary')}
                        </button>

                        <div className="relative">
                            <input
                                type="file"
                                accept=".json"
                                onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;

                                    if (!confirm(t('importConfirm'))) {
                                        e.target.value = ''; // Reset input
                                        return;
                                    }

                                    try {
                                        const text = await file.text();
                                        const data = JSON.parse(text);
                                        const { importDatabase } = await import('@/lib/db');
                                        await importDatabase(data);
                                        alert(t('importSuccess'));
                                        window.location.reload();
                                    } catch (err) {
                                        console.error(err);
                                        alert(t('importFailed'));
                                    }
                                    e.target.value = ''; // Reset input
                                }}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <button
                                type="button"
                                className="w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all bg-zinc-800 text-white hover:bg-zinc-700 active:scale-[0.98]"
                            >
                                <RefreshCcw size={20} className="rotate-90" />
                                {t('importDictionary')}
                            </button>
                        </div>

                        <button
                            type="button"
                            onClick={handleResetAllProgress}
                            className="w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all border border-red-500/20 text-red-400 hover:bg-red-500/10 active:scale-[0.98]"
                        >
                            <RefreshCcw size={20} />
                            {t('resetProgress')}
                        </button>
                    </div>
                </div>
            </form>
        </motion.div >
    );
}
