import { motion } from 'framer-motion';
import { Brain, ChevronRight } from 'lucide-react';
import { Term, QuizEvaluation } from '@/lib/types';

interface FeedbackViewProps {
    term: Term;
    evaluation: QuizEvaluation | null;
    xpReward: number;
    onNext: () => void;
    onManualGrade: (grade: number) => void;
}

export function FeedbackView({ term, evaluation, xpReward, onNext, onManualGrade }: FeedbackViewProps) {
    if (evaluation) {
        return (
            <motion.div
                key="feedback-ai"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card p-10 space-y-8"
            >
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
                            <p className="text-sm text-zinc-400 font-medium">{evaluation.correctAnswer || term.definition}</p>
                        </div>
                    </div>

                    <button onClick={onNext} className="w-full py-5 rounded-2xl bg-white text-black font-bold flex items-center justify-center gap-2 hover:bg-zinc-200 transition-all active:scale-[0.98]">
                        Continue Training
                        <ChevronRight size={20} />
                    </button>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            key="feedback-manual"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-10 space-y-8"
        >
            <div className="space-y-8 text-center">
                <div className="space-y-4">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Internal Definition</p>
                    <p className="text-2xl font-bold leading-tight">{term.definition || "Undefined."}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => { onManualGrade(0); onNext(); }} className="p-4 rounded-xl bg-zinc-900 border border-red-500/20 text-red-400 font-bold hover:bg-red-500/10 transition-colors">Blackout (0)</button>
                    <button onClick={() => { onManualGrade(3); onNext(); }} className="p-4 rounded-xl bg-zinc-900 border border-amber-500/20 text-amber-500 font-bold hover:bg-amber-500/10 transition-colors">Difficult (3)</button>
                    <button onClick={() => { onManualGrade(4); onNext(); }} className="p-4 rounded-xl bg-zinc-900 border border-blue-500/20 text-blue-400 font-bold hover:bg-blue-500/10 transition-colors">Correct (4)</button>
                    <button onClick={() => { onManualGrade(5); onNext(); }} className="p-4 rounded-xl bg-zinc-900 border border-emerald-500/20 text-emerald-500 font-bold hover:bg-emerald-500/10 transition-colors">Perfect (5)</button>
                </div>
            </div>
        </motion.div>
    );
}
