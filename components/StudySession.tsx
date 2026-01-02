'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, Award, Flame, Brain, Zap, Sparkles, AlertCircle, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

import { useStudySession } from '@/hooks/useStudySession';
import { useIsMounted } from '@/hooks/useIsMounted';
import { StudyCard } from './study/StudyCard';
import { FeedbackView } from './study/FeedbackView';
import { useT } from '@/lib/useTranslations';

export default function StudySession() {
    const t = useT('study');
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
        errorMsg,
        preferredAiType,
        setPreferredAiType,
        submitAnswer,
        manualGrade,
        handleNext,
        startSession,
        resetToSelection
    } = useStudySession();

    if (!isMounted || mode === 'loading') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
                    <RotateCcw className="w-12 h-12 text-blue-500 opacity-50" />
                </motion.div>
                <p className="text-zinc-500 font-mono text-xs mt-6 tracking-widest uppercase">{t('session.initializing')}</p>
            </div>
        );
    }

    if (mode === 'selection') {
        return (
            <div className="max-w-4xl mx-auto min-h-[60vh] flex flex-col items-center justify-center">
                <div className="text-center mb-12">
                    <h2 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
                        {t('session.initiate')}
                    </h2>
                    <p className="text-zinc-400 text-lg">{t('session.selectProtocol')}</p>
                </div>

                <div className="flex flex-wrap justify-center gap-3 mb-10">
                    {[
                        { id: 'auto', label: t('quizType.auto'), icon: Sparkles },
                        { id: 'multiple_choice', label: t('quizType.multipleChoice'), icon: Zap },
                        { id: 'cloze', label: t('quizType.cloze'), icon: Sparkles },
                        { id: 'scenario', label: t('quizType.scenario'), icon: Brain },
                        { id: 'definition', label: t('quizType.definition'), icon: Sparkles },
                        { id: 'context', label: t('quizType.context'), icon: Zap }
                    ].map((type) => (
                        <button
                            key={type.id}
                            onClick={() => setPreferredAiType(type.id as any)}
                            className={`px-4 py-2 rounded-xl border text-sm font-bold transition-all flex items-center gap-2 ${preferredAiType === type.id
                                ? 'bg-blue-500 border-blue-400 text-white shadow-lg shadow-blue-500/20'
                                : 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10 hover:border-white/20'
                                }`}
                        >
                            <type.icon size={14} />
                            {type.label}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-3xl">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => startSession('ai')}
                        className="group relative p-8 rounded-3xl border border-blue-500/20 bg-blue-500/5 text-left transition-all hover:border-blue-500/50 hover:bg-blue-500/10"
                    >
                        <div className="relative z-10 space-y-4">
                            <div className="w-16 h-16 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400 mb-6">
                                <Brain size={32} />
                            </div>
                            <h3 className="text-2xl font-bold text-blue-100">{t('mode.ai')}</h3>
                            <p className="text-blue-200/60 leading-relaxed">
                                {t('mode.aiDescription')}
                            </p>
                            <div className="flex items-center gap-2 text-blue-400 text-sm font-bold mt-4">
                                <Sparkles size={14} />
                                <span>{t('mode.aiReward')}</span>
                            </div>
                        </div>
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => startSession('standard')}
                        className="group relative p-8 rounded-3xl border border-emerald-500/20 bg-emerald-500/5 text-left transition-all hover:border-emerald-500/50 hover:bg-emerald-500/10"
                    >
                        <div className="relative z-10 space-y-4">
                            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 mb-6">
                                <Zap size={32} />
                            </div>
                            <h3 className="text-2xl font-bold text-emerald-100">{t('mode.standard')}</h3>
                            <p className="text-emerald-200/60 leading-relaxed">
                                {t('mode.standardDescription')}
                            </p>
                            <div className="flex items-center gap-2 text-emerald-400 text-sm font-bold mt-4">
                                <Flame size={14} />
                                <span>{t('mode.standardEfficiency')}</span>
                            </div>
                        </div>
                    </motion.button>
                </div>
            </div>
        );
    }

    if (mode === 'error') {
        return (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-10 max-w-lg mx-auto border-red-500/20 text-center space-y-8">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto text-red-500">
                    <AlertCircle size={32} />
                </div>
                <div className="space-y-4">
                    <h3 className="text-xl font-bold">{t('session.disruption')}</h3>
                    <p className="text-zinc-400 leading-relaxed">{errorMsg || t('session.unexpectedError')}</p>
                </div>
                <div className="flex flex-col gap-3">
                    <button onClick={resetToSelection} className="w-full py-4 rounded-xl bg-white text-black font-bold flex items-center justify-center gap-2 hover:bg-zinc-200 transition-all active:scale-95">
                        <RotateCcw size={18} />
                        {t('session.retry')}
                    </button>
                    <Link href="/settings" className="w-full py-4 rounded-xl bg-zinc-800 text-white font-bold flex items-center justify-center gap-2 hover:bg-zinc-700 transition-all active:scale-95">
                        {t('session.verifyConfig')}
                    </Link>
                </div>
            </motion.div>
        );
    }

    if (mode === 'finished') {
        return (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-12 text-center max-w-lg mx-auto border-emerald-500/20">
                <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Award className="w-10 h-10 text-emerald-500" />
                </div>
                <h2 className="text-3xl font-bold mb-3">{t('session.syncComplete')}</h2>
                <p className="text-zinc-500 mb-8 font-medium">{t('session.allReinforced')}</p>
                <Link href="/" className="w-full py-4 rounded-xl bg-white text-black font-bold flex items-center justify-center gap-2 hover:bg-zinc-200 transition-all active:scale-95">
                    {t('session.returnHub')}
                </Link>
            </motion.div>
        );
    }

    return (
        <div className="max-w-xl mx-auto space-y-8">
            <div className="flex justify-between items-center bg-white/5 p-3 rounded-2xl border border-white/5">
                <div className="flex items-center gap-3">
                    <button onClick={resetToSelection} className="p-2 hover:bg-white/5 rounded-lg transition-colors text-zinc-400 hover:text-white" title="Change Mode">
                        <ChevronLeft size={20} />
                    </button>
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold">
                        {queue.length}
                    </div>
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-tighter">{t('session.remaining')}</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-zinc-800 rounded-lg">
                    <Flame size={14} className="text-orange-500" />
                    <span className="text-xs font-bold uppercase tracking-tighter">{t('session.activeSync')}</span>
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
                            <p className="text-xl font-bold">{t('session.neuralEvaluation')}</p>
                            <p className="text-xs text-zinc-500 font-mono animate-pulse">{t('session.analyzing')}</p>
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
