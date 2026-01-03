'use client';

import { motion } from 'framer-motion';
import { Check, X, Star, TrendingUp } from 'lucide-react';
import { MentorQuiz } from '@/lib/types';

interface QuizResultCardProps {
    quiz: MentorQuiz;
    onContinue: () => void;
}

export function QuizResultCard({ quiz, onContinue }: QuizResultCardProps) {
    if (!quiz.evaluation) return null;

    const grade = quiz.evaluation.grade;
    const isExcellent = grade >= 4;
    const isGood = grade >= 3;
    const isPoor = grade < 2;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`
                glass-card p-6 border-2
                ${isExcellent ? 'border-green-500/50' : isGood ? 'border-blue-500/50' : 'border-orange-500/50'}
            `}
        >
            {/* Grade Display */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className={`
                        w-16 h-16 rounded-2xl flex items-center justify-center
                        ${isExcellent ? 'bg-green-500' : isGood ? 'bg-blue-500' : 'bg-orange-500'}
                    `}>
                        {isExcellent ? (
                            <Star size={32} className="text-white" />
                        ) : isGood ? (
                            <Check size={32} className="text-white" />
                        ) : (
                            <TrendingUp size={32} className="text-white" />
                        )}
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Your Score</p>
                        <p className="text-3xl font-bold">{grade}.0<span className="text-lg text-zinc-500">/5</span></p>
                    </div>
                </div>

                <div className="text-right">
                    <div className={`text-sm font-bold ${isExcellent ? 'text-green-400' : isGood ? 'text-blue-400' : 'text-orange-400'}`}>
                        {isExcellent ? 'Excellent!' : isGood ? 'Good job!' : 'Keep learning!'}
                    </div>
                    <div className="text-xs text-zinc-500">
                        +{15 + (grade * 3)} XP
                    </div>
                </div>
            </div>

            {/* Feedback */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-4"
            >
                <p className="text-zinc-300">{quiz.evaluation.feedback}</p>
            </motion.div>

            {/* Correct Answer (if wrong) */}
            {isPoor && quiz.evaluation.correctAnswer && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 mb-4"
                >
                    <p className="text-xs text-blue-400 font-bold uppercase tracking-widest mb-1">Correct Answer</p>
                    <p className="text-sm text-zinc-300">{quiz.evaluation.correctAnswer}</p>
                </motion.div>
            )}

            {/* Continue Button */}
            <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                onClick={onContinue}
                className={`
                    w-full py-4 rounded-xl font-bold text-white transition-all
                    ${isExcellent
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'
                        : isGood
                        ? 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600'
                        : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600'
                    }
                `}
            >
                Continue Learning
            </motion.button>

            {/* XP Animation */}
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
                className="mt-4 flex justify-center gap-1"
            >
                {[...Array(Math.min(grade, 5))].map((_, i) => (
                    <motion.div
                        key={i}
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 0.6 + i * 0.1, type: 'spring' }}
                    >
                        <Star
                            size={16}
                            className={isExcellent ? 'text-yellow-400' : 'text-zinc-600'}
                            fill={isExcellent ? 'currentColor' : 'none'}
                        />
                    </motion.div>
                ))}
            </motion.div>
        </motion.div>
    );
}
