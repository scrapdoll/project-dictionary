'use client';

import { useEffect, useState } from 'react';
import { db, type Term, type Progress } from '@/lib/db';
import { calculateNextReview } from '@/lib/srs';
import { generateQuiz, evaluateAnswer, type QuizGeneration, type QuizEvaluation } from '@/lib/ai';
import { useLiveQuery } from 'dexie-react-hooks';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Check, X, RotateCcw, AlertCircle, Send, ChevronRight, Award, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useIsMounted } from '@/hooks/useIsMounted';

type StudyState = 'loading' | 'ready' | 'question' | 'evaluating' | 'feedback' | 'finished' | 'error';

export default function StudySession() {
    const isMounted = useIsMounted();
    const settings = useLiveQuery(() => db.settings.get(1));
    const [queue, setQueue] = useState<{ term: Term, progress: Progress }[]>([]);
    const [currentItem, setCurrentItem] = useState<{ term: Term, progress: Progress } | null>(null);

    const [mode, setMode] = useState<StudyState>('loading');
    const [aiQuiz, setAiQuiz] = useState<QuizGeneration | null>(null);
    const [userAnswer, setUserAnswer] = useState('');
    const [evaluation, setEvaluation] = useState<QuizEvaluation | null>(null);
    const [errorMsg, setErrorMsg] = useState('');
    const [xpReward, setXpReward] = useState(0);

    useEffect(() => {
        loadDueItems();
    }, []);

    async function loadDueItems() {
        setMode('loading');
        const now = Date.now();
        try {
            const dueProgress = await db.progress.where('nextReview').belowOrEqual(now).sortBy('nextReview');
            const items = [];
            for (const p of dueProgress) {
                const term = await db.terms.get(p.termId);
                if (term) items.push({ term, progress: p });
            }
            items.splice(20);
            setQueue(items);
            if (items.length > 0) {
                startItem(items[0]);
            } else {
                setMode('finished');
            }
        } catch (err) {
            console.error(err);
            setErrorMsg("Failed to synchronize study queue.");
            setMode('error');
        }
    }

    async function startItem(item: { term: Term, progress: Progress }) {
        setCurrentItem(item);
        setUserAnswer('');
        setAiQuiz(null);
        setEvaluation(null);
        setMode('loading');

        if (settings?.aiEnabled && settings.apiKey) {
            try {
                const quiz = await generateQuiz(
                    item.term.content,
                    item.term.context || '',
                    settings.apiKey,
                    settings.model,
                    settings.apiBaseUrl
                );
                setAiQuiz(quiz);
                setMode('question');
            } catch (err) {
                console.error("AI Gen Failed", err);
                setMode('question');
            }
        } else {
            setMode('question');
        }
    }

    async function handleSubmitAnswer() {
        if (!currentItem) return;

        if (aiQuiz && settings?.apiKey) {
            setMode('evaluating');
            try {
                const ev = await evaluateAnswer(
                    currentItem.term.content,
                    aiQuiz.question,
                    userAnswer,
                    settings.apiKey,
                    settings.model,
                    settings.apiBaseUrl
                );
                setEvaluation(ev);
                setMode('feedback');
                await updateProgress(ev.grade);
            } catch (err) {
                console.error("AI Eval Failed", err);
                setErrorMsg("AI Synchronizer offline. Please rate recall manually.");
                setMode('feedback');
            }
        } else {
            setMode('feedback');
        }
    }

    async function updateProgress(grade: number) {
        if (!currentItem) return;

        const { term, progress } = currentItem;
        const xpGain = 10 + (Number(grade) * 2);
        setXpReward(xpGain);

        await db.transaction('rw', db.progress, db.settings, async () => {
            const freshProgress = await db.progress.get(progress.termId);
            if (!freshProgress) return;

            const result = calculateNextReview(grade, freshProgress.repetition, freshProgress.efactor, freshProgress.interval);
            const history = Array.isArray(freshProgress.history) ? freshProgress.history : [];

            console.log(`[SRS] Syncing ${term.content}: grade=${grade}, oldRep=${freshProgress.repetition}, newRep=${result.repetition}, interval=${result.interval}d, next=${new Date(result.nextReview).toLocaleString()}`);

            await db.progress.put({
                termId: progress.termId,
                nextReview: Math.floor(result.nextReview),
                interval: Math.floor(result.interval),
                repetition: Math.floor(result.repetition),
                efactor: result.efactor,
                history: [...history, { date: Date.now(), grade: Number(grade) }]
            });

            const currentSettings = await db.settings.get(1);
            if (currentSettings) {
                await db.settings.update(1, { xp: (currentSettings.xp || 0) + xpGain });
            } else {
                // Initialize default settings with first XP if they don't exist
                await db.settings.put({
                    id: 1,
                    apiKey: '',
                    apiBaseUrl: 'https://api.openai.com/v1',
                    model: 'gpt-4o',
                    aiEnabled: true,
                    xp: xpGain
                });
            }
        });
    }

    function handleNext() {
        const nextQueue = queue.slice(1);
        setQueue(nextQueue);
        if (nextQueue.length > 0) {
            startItem(nextQueue[0]);
        } else {
            setMode('finished');
        }
    }

    if (!isMounted || mode === 'loading') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
                    <RotateCcw className="w-12 h-12 text-blue-500 opacity-50" />
                </motion.div>
                <p className="text-zinc-500 font-mono text-xs mt-6 tracking-widest uppercase">Initializing Neural Link...</p>
            </div>
        );
    }

    if (mode === 'finished') {
        return (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-12 text-center max-w-lg mx-auto border-emerald-500/20">
                <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Award className="w-10 h-10 text-emerald-500" />
                </div>
                <h2 className="text-3xl font-bold mb-3">Sync Complete</h2>
                <p className="text-zinc-500 mb-8 font-medium">All neural pathways have been reinforced for today.</p>
                <Link href="/" className="w-full py-4 rounded-xl bg-white text-black font-bold flex items-center justify-center gap-2 hover:bg-zinc-200 transition-all active:scale-95">
                    Return to Hub
                </Link>
            </motion.div>
        );
    }

    return (
        <div className="max-w-xl mx-auto space-y-8">
            <div className="flex justify-between items-center bg-white/5 p-3 rounded-2xl border border-white/5">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold">
                        {queue.length}
                    </div>
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-tighter">Remaining Subjects</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-zinc-800 rounded-lg">
                    <Flame size={14} className="text-orange-500" />
                    <span className="text-xs font-bold">Focus Mode</span>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {mode === 'question' && (
                    <motion.div key="question" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="glass-card p-10 space-y-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl pointer-events-none" />

                        {aiQuiz ? (
                            <div className="space-y-8">
                                <div className="flex items-center gap-2 text-blue-400 font-bold uppercase text-[10px] tracking-widest">
                                    <Brain size={14} /> AI Context Injection
                                </div>
                                <p className="text-2xl font-bold leading-tight tracking-tight text-zinc-100">{aiQuiz.question}</p>
                                <textarea
                                    className="glass-input min-h-[160px] text-lg leading-relaxed"
                                    placeholder="Enter your response..."
                                    value={userAnswer}
                                    onChange={e => setUserAnswer(e.target.value)}
                                    autoFocus
                                />
                                <button onClick={handleSubmitAnswer} className="w-full py-5 rounded-2xl bg-white text-black font-bold flex items-center justify-center gap-2 hover:bg-zinc-200 transition-all active:scale-[0.98] shadow-2xl">
                                    Transmit Result
                                    <Send size={18} />
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-10 text-center py-6">
                                <div className="space-y-2">
                                    <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.3em]">Subject Identifier</div>
                                    <h2 className="text-5xl font-black tracking-tighter text-glow">{currentItem?.term.content}</h2>
                                </div>
                                {currentItem?.term.context && (
                                    <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                                        <p className="text-zinc-400 italic text-sm">"{currentItem.term.context}"</p>
                                    </div>
                                )}
                                <button onClick={handleSubmitAnswer} className="w-full py-5 rounded-2xl bg-white text-black font-bold text-lg hover:bg-zinc-200 transition-all active:scale-[0.98]">
                                    Reveal Pattern
                                </button>
                            </div>
                        )}
                    </motion.div>
                )}

                {mode === 'evaluating' && (
                    <motion.div key="evaluating" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-20 flex flex-col items-center justify-center space-y-8">
                        <div className="relative">
                            <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.5 }} className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full" />
                            <Brain size={64} className="text-blue-500 relative z-10" />
                        </div>
                        <div className="text-center space-y-2">
                            <p className="text-xl font-bold">Neural Evaluation</p>
                            <p className="text-xs text-zinc-500 font-mono animate-pulse">Analyzing semantic accuracy...</p>
                        </div>
                    </motion.div>
                )}

                {mode === 'feedback' && (
                    <motion.div key="feedback" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-10 space-y-8">
                        {evaluation ? (
                            <div className="space-y-8">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Grade Score</p>
                                        <h3 className="text-4xl font-black">{evaluation.grade}.0<span className="text-xl text-zinc-500">/5</span></h3>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">Experience</p>
                                        <p className="text-2xl font-bold">+{xpReward} XP</p>
                                    </div>
                                </div>

                                <div className="bg-white/5 rounded-2xl p-6 border border-white/5 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-3 opacity-10">
                                        <Brain size={48} />
                                    </div>
                                    <p className="text-zinc-300 leading-relaxed font-medium mb-4">{evaluation.feedback}</p>
                                    <div className="pt-4 border-t border-white/10">
                                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Ideal Pattern</p>
                                        <p className="text-sm text-zinc-400 font-medium">{evaluation.correctAnswer || currentItem?.term.definition}</p>
                                    </div>
                                </div>

                                <button onClick={handleNext} className="w-full py-5 rounded-2xl bg-white text-black font-bold flex items-center justify-center gap-2 hover:bg-zinc-200 transition-all active:scale-[0.98]">
                                    Continue Training
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-8 text-center">
                                <div className="space-y-4">
                                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Internal Definition</p>
                                    <p className="text-2xl font-bold leading-tight">{currentItem?.term.definition || "Undefined."}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <button onClick={() => { updateProgress(0); handleNext(); }} className="p-4 rounded-xl bg-zinc-900 border border-red-500/20 text-red-400 font-bold hover:bg-red-500/10 transition-colors">Blackout (0)</button>
                                    <button onClick={() => { updateProgress(3); handleNext(); }} className="p-4 rounded-xl bg-zinc-900 border border-amber-500/20 text-amber-500 font-bold hover:bg-amber-500/10 transition-colors">Difficult (3)</button>
                                    <button onClick={() => { updateProgress(4); handleNext(); }} className="p-4 rounded-xl bg-zinc-900 border border-blue-500/20 text-blue-400 font-bold hover:bg-blue-500/10 transition-colors">Correct (4)</button>
                                    <button onClick={() => { updateProgress(5); handleNext(); }} className="p-4 rounded-xl bg-zinc-900 border border-emerald-500/20 text-emerald-500 font-bold hover:bg-emerald-500/10 transition-colors">Perfect (5)</button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
