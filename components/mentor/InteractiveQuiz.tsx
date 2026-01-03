'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, ChevronRight } from 'lucide-react';
import { MentorQuiz } from '@/lib/types';

interface InteractiveQuizProps {
    quiz: MentorQuiz;
    onAnswer: (answer: string) => void;
}

interface ValidationResult {
    isValid: boolean;
    error: string | null;
    correctIndex: number;
}

/**
 * Validates multiple-choice quiz configuration
 * Returns validity status, error message, and the correct answer index
 */
function validateMultipleChoiceQuiz(quiz: MentorQuiz): ValidationResult {
    if (quiz.type !== 'multiple_choice' || !quiz.options) {
        return { isValid: true, error: null, correctIndex: 0 };
    }

    if (quiz.correctAnswer === undefined) {
        return {
            isValid: false,
            error: 'Quiz configuration error: correct answer not specified by AI',
            correctIndex: -1
        };
    }

    if (quiz.correctAnswer < 0 || quiz.correctAnswer >= quiz.options.length) {
        return {
            isValid: false,
            error: `Quiz configuration error: correct answer index ${quiz.correctAnswer} is out of bounds (0-${quiz.options.length - 1})`,
            correctIndex: -1
        };
    }

    return {
        isValid: true,
        error: null,
        correctIndex: quiz.correctAnswer
    };
}

export function InteractiveQuiz({ quiz, onAnswer }: InteractiveQuizProps) {
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showResult, setShowResult] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [textAnswer, setTextAnswer] = useState('');

    // Single source of truth for quiz validation
    const validation = useMemo(() => validateMultipleChoiceQuiz(quiz), [quiz]);

    const handleSubmit = async () => {
        const answer = selectedOption || textAnswer;
        if (!answer.trim()) return;

        setIsSubmitting(true);

        // Simulate evaluation delay for better UX
        await new Promise(resolve => setTimeout(resolve, 600));

        // For multiple choice, validate before showing feedback
        if (quiz.type === 'multiple_choice' && quiz.options) {
            if (!validation.isValid) {
                setIsSubmitting(false);
                return;
            }

            setIsCorrect(selectedOption === quiz.options[validation.correctIndex]);
            setShowResult(true);

            setTimeout(() => {
                onAnswer(answer);
            }, 1500);
        } else {
            // For other types, submit immediately
            onAnswer(answer);
        }
    };

    if (quiz.type === 'multiple_choice' && quiz.options) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="glass-card p-6 space-y-4"
            >
                <div className="flex items-center gap-2 text-sm font-bold text-blue-400 uppercase tracking-widest">
                    <span>Multiple Choice</span>
                </div>

                <h3 className="text-xl font-semibold">{quiz.question}</h3>

                {/* Show validation error if quiz is misconfigured */}
                {!validation.isValid && validation.error && (
                    <div className="p-4 rounded-xl bg-red-500/20 border border-red-500/50 text-red-400">
                        {validation.error}
                    </div>
                )}

                <div className="space-y-2">
                    {quiz.options.map((option, index) => {
                        const isSelected = selectedOption === option;
                        const showCorrect = showResult && index === validation.correctIndex;
                        const showIncorrect = showResult && isSelected && index !== validation.correctIndex;

                        return (
                            <motion.button
                                key={index}
                                onClick={() => !showResult && setSelectedOption(option)}
                                disabled={showResult}
                                whileHover={{ scale: showResult ? 1 : 1.01 }}
                                whileTap={{ scale: showResult ? 1 : 0.99 }}
                                className={`
                                    w-full p-4 rounded-xl text-left font-medium transition-all border-2
                                    ${isSelected && !showResult
                                        ? 'bg-blue-500 border-blue-500 text-white shadow-lg shadow-blue-500/25'
                                        : 'bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-white'
                                    }
                                    ${showCorrect ? '!bg-green-500 !border-green-500 text-white' : ''}
                                    ${showIncorrect ? '!bg-red-500 !border-red-500 text-white' : ''}
                                    ${showResult ? 'cursor-default' : 'cursor-pointer'}
                                `}
                            >
                                <div className="flex items-center justify-between">
                                    <span>{option}</span>
                                    {showCorrect && <Check size={20} />}
                                    {showIncorrect && <X size={20} />}
                                </div>
                            </motion.button>
                        );
                    })}
                </div>

                <AnimatePresence>
                    {showResult && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`
                                p-4 rounded-xl text-center font-bold
                                ${isCorrect ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}
                            `}
                        >
                            {isCorrect ? 'Excellent work!' : 'Not quite - let\'s review this together!'}
                        </motion.div>
                    )}
                </AnimatePresence>

                {!showResult && (
                    <button
                        onClick={handleSubmit}
                        disabled={!selectedOption || isSubmitting || !validation.isValid}
                        className="w-full py-4 rounded-xl bg-blue-500 text-white font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? (
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            >
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
                            </motion.div>
                        ) : (
                            <>
                                Check Answer
                                <ChevronRight size={20} />
                            </>
                        )}
                    </button>
                )}
            </motion.div>
        );
    }

    if (quiz.type === 'cloze') {
        const parts = quiz.question.split(/_{4,}/); // Split on 4+ underscores
        const blankCount = parts.length - 1;
        // Use array of answers for multiple blanks
        const [clozeAnswers, setClozeAnswers] = useState<string[]>(() => Array(blankCount).fill(''));

        const handleClozeChange = (index: number, value: string) => {
            const newAnswers = [...clozeAnswers];
            newAnswers[index] = value;
            setClozeAnswers(newAnswers);
        };

        const handleClozeSubmit = () => {
            const fullAnswer = clozeAnswers.join(' | ');
            onAnswer(fullAnswer);
        };

        const allFilled = clozeAnswers.every(a => a.trim().length > 0);

        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="glass-card p-6 space-y-4"
            >
                <div className="flex items-center gap-2 text-sm font-bold text-purple-400 uppercase tracking-widest">
                    <span>Fill in the Blank</span>
                </div>

                <h3 className="text-xl font-semibold">Complete the sentence:</h3>

                <div className="text-lg text-zinc-300 p-4 bg-zinc-800/50 rounded-xl">
                    {parts.map((part, i, array) => (
                        <span key={i}>
                            {part}
                            {i < array.length - 1 && (
                                <input
                                    type="text"
                                    value={clozeAnswers[i] || ''}
                                    onChange={(e) => handleClozeChange(i, e.target.value)}
                                    className="inline-block min-w-[120px] mx-1 px-3 py-1 border-b-2 border-purple-400 bg-purple-500/10 text-purple-400 outline-none focus:bg-purple-500/20 transition-colors text-center"
                                    placeholder="_____"
                                    autoFocus={i === 0}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            const nextInput = e.currentTarget.parentElement?.querySelectorAll('input')[i + 1];
                                            if (nextInput) {
                                                nextInput.focus();
                                            } else if (allFilled) {
                                                handleClozeSubmit();
                                            }
                                        }
                                    }}
                                />
                            )}
                        </span>
                    ))}
                </div>

                <button
                    onClick={handleClozeSubmit}
                    disabled={!allFilled || isSubmitting}
                    className="w-full py-4 rounded-xl bg-purple-500 text-white font-bold hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isSubmitting ? (
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        >
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
                        </motion.div>
                    ) : (
                        <>
                            Submit Answer
                            <ChevronRight size={20} />
                        </>
                    )}
                </button>
            </motion.div>
        );
    }

    if (quiz.type === 'short_answer') {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="glass-card p-6 space-y-4"
            >
                <div className="flex items-center gap-2 text-sm font-bold text-orange-400 uppercase tracking-widest">
                    <span>Short Answer</span>
                </div>

                <h3 className="text-xl font-semibold">{quiz.question}</h3>

                <textarea
                    value={textAnswer}
                    onChange={(e) => setTextAnswer(e.target.value)}
                    placeholder="Explain in your own words..."
                    className="glass-input min-h-[100px] resize-none"
                    autoFocus
                />

                <button
                    onClick={handleSubmit}
                    disabled={!textAnswer.trim() || isSubmitting}
                    className="w-full py-4 rounded-xl bg-orange-500 text-white font-bold hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isSubmitting ? (
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        >
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
                        </motion.div>
                    ) : (
                        <>
                            Submit Answer
                            <ChevronRight size={20} />
                        </>
                    )}
                </button>
            </motion.div>
        );
    }

    // Default fallback for other quiz types
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass-card p-6 space-y-4"
        >
            <div className="flex items-center gap-2 text-sm font-bold text-zinc-400 uppercase tracking-widest">
                <span>{quiz.type}</span>
            </div>

            <h3 className="text-xl font-semibold">{quiz.question}</h3>

            <textarea
                value={textAnswer}
                onChange={(e) => setTextAnswer(e.target.value)}
                placeholder="Type your answer..."
                className="glass-input min-h-[80px] resize-none"
                autoFocus
            />

            <button
                onClick={handleSubmit}
                disabled={!textAnswer.trim() || isSubmitting}
                className="w-full py-4 rounded-xl bg-blue-500 text-white font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isSubmitting ? 'Submitting...' : 'Submit Answer'}
            </button>
        </motion.div>
    );
}
