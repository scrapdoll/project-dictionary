import { motion } from 'framer-motion';
import { Brain, Send } from 'lucide-react';
import { Term, QuizGeneration } from '@/lib/types';

interface StudyCardProps {
    term: Term;
    aiQuiz: QuizGeneration | null;
    userAnswer: string;
    onUserAnswerChange: (value: string) => void;
    onSubmit: () => void;
}

export function StudyCard({ term, aiQuiz, userAnswer, onUserAnswerChange, onSubmit }: StudyCardProps) {
    if (aiQuiz) {
        return (
            <motion.div
                key="question-ai"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="glass-card p-10 space-y-8 relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl pointer-events-none" />
                <div className="space-y-8">
                    <div className="flex items-center gap-2 text-blue-400 font-bold uppercase text-[10px] tracking-widest">
                        <Brain size={14} /> AI Context Injection
                    </div>
                    <p className="text-2xl font-bold leading-tight tracking-tight text-zinc-100">{aiQuiz.question}</p>
                    {aiQuiz.type === 'multiple_choice' && aiQuiz.options ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {aiQuiz.options.map((option, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => {
                                        onUserAnswerChange(option);
                                        // Auto-submit for better UX in mobile
                                        setTimeout(onSubmit, 100);
                                    }}
                                    className={`p-4 rounded-xl text-left transition-all border ${userAnswer === option
                                            ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                                            : 'bg-white/5 border-white/5 text-zinc-300 hover:bg-white/10'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] border ${userAnswer === option ? 'border-blue-500 bg-blue-500 text-white' : 'border-white/20'
                                            }`}>
                                            {String.fromCharCode(65 + idx)}
                                        </div>
                                        {option}
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <textarea
                            className="glass-input min-h-[160px] text-lg leading-relaxed"
                            placeholder="Enter your response..."
                            value={userAnswer}
                            onChange={e => onUserAnswerChange(e.target.value)}
                            autoFocus
                        />
                    )}
                    <button onClick={onSubmit} className="w-full py-5 rounded-2xl bg-white text-black font-bold flex items-center justify-center gap-2 hover:bg-zinc-200 transition-all active:scale-[0.98] shadow-2xl">
                        Transmit Result
                        <Send size={18} />
                    </button>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            key="question-standard"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="glass-card p-10 space-y-8 relative overflow-hidden"
        >
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl pointer-events-none" />
            <div className="space-y-10 text-center py-6">
                <div className="space-y-2">
                    <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.3em]">Subject Identifier</div>
                    <h2 className="text-5xl font-black tracking-tighter text-glow">{term.content}</h2>
                </div>
                {term.context && (
                    <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                        <p className="text-zinc-400 italic text-sm">"{term.context}"</p>
                    </div>
                )}
                <button onClick={onSubmit} className="w-full py-5 rounded-2xl bg-white text-black font-bold text-lg hover:bg-zinc-200 transition-all active:scale-[0.98]">
                    Reveal Pattern
                </button>
            </div>
        </motion.div>
    );
}
