'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, Award, Flame, Brain } from 'lucide-react';
import Link from 'next/link';

import { useStudySession } from '@/hooks/useStudySession';
import { useIsMounted } from '@/hooks/useIsMounted';
import { StudyCard } from './study/StudyCard';
import { FeedbackView } from './study/FeedbackView';

export default function StudySession() {
    const isMounted = useIsMounted();
    const {
        mode,
        queue,
        currentItem,
        aiQuiz,
        userAnswer,
        setUserAnswer,
        evaluation,
        xpReward,
        submitAnswer,
        manualGrade,
        handleNext
    } = useStudySession();

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
                {mode === 'question' && currentItem && (
                    <StudyCard
                        key="question"
                        term={currentItem.term}
                        aiQuiz={aiQuiz}
                        userAnswer={userAnswer}
                        onUserAnswerChange={setUserAnswer}
                        onSubmit={submitAnswer}
                    />
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

                {mode === 'feedback' && currentItem && (
                    <FeedbackView
                        key="feedback"
                        term={currentItem.term}
                        evaluation={evaluation}
                        xpReward={xpReward}
                        onNext={handleNext}
                        onManualGrade={manualGrade}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
