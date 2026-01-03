'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Brain, Sparkles } from 'lucide-react';
import { MentorQuiz } from '@/lib/types';

interface InteractiveQuizProps {
    quiz: MentorQuiz;
    onAnswer: (answer: string) => void;
}

export function InteractiveQuiz({ quiz, onAnswer }: InteractiveQuizProps) {
    const [selectedAnswer, setSelectedAnswer] = useState('');
    const [textAnswer, setTextAnswer] = useState('');

    const handleSubmit = () => {
        const answer = quiz.type === 'multiple_choice' ? selectedAnswer : textAnswer;
        if (answer.trim()) {
            onAnswer(answer);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass-card p-6 mb-4 border border-purple-500/20"
        >
            <div className="flex items-center gap-2 mb-4">
                <Brain size={18} className="text-purple-400" />
                <p className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">
                    Quick Check
                </p>
            </div>

            <p className="text-lg font-semibold mb-4">{quiz.question}</p>

            {quiz.type === 'multiple_choice' && quiz.options ? (
                <div className="space-y-2 mb-4">
                    {quiz.options.map((option, idx) => (
                        <button
                            key={idx}
                            onClick={() => setSelectedAnswer(option)}
                            className={`w-full p-4 rounded-xl text-left transition-all ${
                                selectedAnswer === option
                                    ? 'bg-purple-500/20 border-purple-500 text-purple-400'
                                    : 'bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10'
                            } border`}
                        >
                            <span className="font-bold mr-2">{String.fromCharCode(65 + idx)}.</span>
                            {option}
                        </button>
                    ))}
                </div>
            ) : quiz.type === 'cloze' && quiz.question.includes('____') ? (
                <div className="mb-4">
                    <div className="text-lg font-bold leading-relaxed">
                        {quiz.question.split('____').map((part, i, array) => (
                            <span key={i}>
                                {part}
                                {i < array.length - 1 && (
                                    <input
                                        type="text"
                                        className="mx-2 px-3 py-1 bg-white/10 border-b-2 border-purple-500/50 focus:border-purple-500 outline-none rounded-md transition-all text-purple-400"
                                        style={{ width: `${Math.max(textAnswer.length, 3) + 1}ch` }}
                                        value={textAnswer}
                                        onChange={(e) => setTextAnswer(e.target.value)}
                                        autoFocus
                                    />
                                )}
                            </span>
                        ))}
                    </div>
                </div>
            ) : (
                <textarea
                    className="glass-input min-h-[100px] mb-4"
                    placeholder="Type your answer..."
                    value={textAnswer}
                    onChange={(e) => setTextAnswer(e.target.value)}
                    autoFocus
                />
            )}

            <button
                onClick={handleSubmit}
                disabled={!selectedAnswer && !textAnswer}
                className="w-full py-3 rounded-xl bg-purple-500 text-white font-bold hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                <Sparkles size={18} />
                Submit Answer
            </button>
        </motion.div>
    );
}
