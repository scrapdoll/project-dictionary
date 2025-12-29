'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { Save, AlertCircle, Bot, Globe, Key, Cpu, RefreshCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function SettingsPage() {
    const currentSettings = useLiveQuery(() => db.settings.get(1));
    const [formData, setFormData] = useState({
        apiKey: '',
        apiBaseUrl: 'https://api.openai.com/v1',
        model: 'gpt-4o',
        language: typeof navigator !== 'undefined' ? navigator.language : 'en-US',
        aiEnabled: true,
    });

    const [status, setStatus] = useState<'idle' | 'saved'>('idle');

    useEffect(() => {
        if (currentSettings) {
            setFormData({
                apiKey: currentSettings.apiKey,
                apiBaseUrl: currentSettings.apiBaseUrl,
                model: currentSettings.model,
                language: currentSettings.language || navigator.language,
                aiEnabled: currentSettings.aiEnabled,
            });
        }
    }, [currentSettings]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        await db.settings.put({
            id: 1,
            ...formData,
            xp: currentSettings?.xp || 0
        });
        setStatus('saved');
        setTimeout(() => setStatus('idle'), 2000);
    };

    const handleResetAllProgress = async () => {
        if (confirm('Are you sure you want to reset ALL progress statistics? This will mark all words as "New" and clear your review history. This action cannot be undone.')) {
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
            alert('All progress has been reset.');
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl mx-auto space-y-10 pt-10"
        >
            <div className="space-y-3 text-center">
                <h1 className="text-4xl font-extrabold tracking-tight">System <span className="text-glow">Config</span></h1>
                <p className="text-zinc-500 font-medium tracking-wide uppercase text-xs">Bridge the gap between brain and AI</p>
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
                            <p className="font-bold">Neural Engine</p>
                            <p className="text-xs text-zinc-500">Enable AI-powered quizzing and grading</p>
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
                            className="space-y-6 overflow-hidden"
                        >
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-bold text-zinc-300">
                                    <Globe size={16} className="text-zinc-500" />
                                    API Endpoint
                                </label>
                                <input
                                    type="text"
                                    className="glass-input font-mono text-sm"
                                    placeholder="https://api.openai.com/v1"
                                    value={formData.apiBaseUrl}
                                    onChange={e => setFormData(prev => ({ ...prev, apiBaseUrl: e.target.value }))}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-bold text-zinc-300">
                                    <Key size={16} className="text-zinc-500" />
                                    Access Token
                                </label>
                                <input
                                    type="password"
                                    className="glass-input font-mono text-sm"
                                    placeholder="sk-••••••••••••••••••••••••"
                                    value={formData.apiKey}
                                    onChange={e => setFormData(prev => ({ ...prev, apiKey: e.target.value }))}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-bold text-zinc-300">
                                    <Cpu size={16} className="text-zinc-500" />
                                    Intelligence Model
                                </label>
                                <input
                                    type="text"
                                    className="glass-input font-mono text-sm"
                                    placeholder="gpt-4o"
                                    value={formData.model}
                                    onChange={e => setFormData(prev => ({ ...prev, model: e.target.value }))}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-bold text-zinc-300">
                                    <Globe size={16} className="text-zinc-500" />
                                    AI Language
                                </label>
                                <select
                                    className="glass-input text-sm appearance-none bg-zinc-900"
                                    value={formData.language}
                                    onChange={e => setFormData(prev => ({ ...prev, language: e.target.value }))}
                                >
                                    <option value="en-US">English (US)</option>
                                    <option value="es-ES">Spanish</option>
                                    <option value="fr-FR">French</option>
                                    <option value="de-DE">German</option>
                                    <option value="it-IT">Italian</option>
                                    <option value="pt-BR">Portuguese</option>
                                    <option value="ru-RU">Russian</option>
                                    <option value="zh-CN">Chinese</option>
                                    <option value="ja-JP">Japanese</option>
                                    <option value="ko-KR">Korean</option>
                                    <option value={navigator.language || 'en-US'}>System Default ({navigator.language})</option>
                                </select>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="pt-6 flex flex-col items-center gap-6 border-t border-white/5">
                    <div className="text-xs text-zinc-500 flex items-center gap-2 bg-zinc-900/50 px-4 py-2 rounded-full border border-zinc-800">
                        <AlertCircle size={14} className="text-amber-500/70" />
                        Keys are stored locally in IndexedDB. Never shared.
                    </div>
                    <button
                        type="submit"
                        className={cn(
                            "w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98]",
                            status === 'saved' ? "bg-emerald-500 text-white" : "bg-white text-black hover:bg-zinc-200"
                        )}
                    >
                        {status === 'saved' ? (
                            <>Done!</>
                        ) : (
                            <>
                                <Save size={20} />
                                Synchronize Configuration
                            </>
                        )}
                    </button>

                    <div className="w-full pt-6 border-t border-white/5 space-y-4">
                        <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest text-center mb-4">Data Management</p>

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
                            <RefreshCcw size={20} className="rotate-180" />
                            Export Dictionary to JSON
                        </button>

                        <button
                            type="button"
                            onClick={handleResetAllProgress}
                            className="w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all border border-red-500/20 text-red-400 hover:bg-red-500/10 active:scale-[0.98]"
                        >
                            <RefreshCcw size={20} />
                            Reset All Progress Statistics
                        </button>
                    </div>
                </div>
            </form>
        </motion.div >
    );
}
