'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, AlertCircle, X } from 'lucide-react';
import { MentorChatMessage, MentorQuiz, ChatState } from '@/lib/types';
import { MessageBubble } from './MessageBubble';
import { InteractiveQuiz } from './InteractiveQuiz';
import { useT } from '@/lib/useTranslations';

interface ChatInterfaceProps {
    messages: MentorChatMessage[];
    currentQuiz: MentorQuiz | null;
    state: ChatState;
    error: string;
    onSendMessage: (message: string) => void;
    onQuizAnswer: (answer: string) => void;
    onContinue: () => void;
    onClearError: () => void;
}

export function ChatInterface({
    messages,
    currentQuiz,
    state,
    error,
    onSendMessage,
    onQuizAnswer,
    onContinue,
    onClearError
}: ChatInterfaceProps) {
    const t = useT('mentor');
    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, currentQuiz]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputValue.trim() && state === 'idle') {
            onSendMessage(inputValue.trim());
            setInputValue('');
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-12rem)]">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-4 pb-4">
                <AnimatePresence mode="popLayout">
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex gap-3"
                        >
                            <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 flex-shrink-0">
                                <AlertCircle size={16} />
                            </div>
                            <div className="glass-card px-4 py-3 max-w-[80%] border border-red-500/20">
                                <div className="flex items-start justify-between gap-3">
                                    <p className="text-red-400 text-sm">{error}</p>
                                    <button
                                        onClick={onClearError}
                                        className="text-zinc-500 hover:text-zinc-300 transition-colors"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {messages.map((message) => (
                        <MessageBubble key={message.id} message={message} />
                    ))}

                    {state === 'receiving' && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex gap-3"
                        >
                            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 flex-shrink-0">
                                <Loader2 size={16} className="animate-spin" />
                            </div>
                            <div className="glass-card px-4 py-3 max-w-[80%]">
                                <div className="flex gap-1">
                                    <div className="w-2 h-2 bg-blue-500/50 rounded-full animate-bounce" />
                                    <div className="w-2 h-2 bg-blue-500/50 rounded-full animate-bounce delay-100" />
                                    <div className="w-2 h-2 bg-blue-500/50 rounded-full animate-bounce delay-200" />
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
                <div ref={messagesEndRef} />
            </div>

            {/* Quiz Overlay */}
            <AnimatePresence>
                {currentQuiz && !currentQuiz.completed && state === 'quiz' && (
                    <InteractiveQuiz
                        quiz={currentQuiz}
                        onAnswer={onQuizAnswer}
                    />
                )}

                {currentQuiz?.completed && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="glass-card p-6 mb-4 border border-blue-500/20"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Grade</p>
                                <p className="text-2xl font-bold">{currentQuiz.evaluation?.grade}.0/5</p>
                            </div>
                            <button
                                onClick={onContinue}
                                className="px-6 py-3 rounded-xl bg-blue-500 text-white font-bold hover:bg-blue-600 transition-colors"
                            >
                                {t('quiz.continue')}
                            </button>
                        </div>
                        <p className="mt-4 text-zinc-300">{currentQuiz.evaluation?.feedback}</p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Input */}
            <form onSubmit={handleSubmit} className="glass-card p-2">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder={state === 'idle' ? t('input.placeholder') : '...'}
                        disabled={state !== 'idle'}
                        className="flex-1 bg-transparent px-4 py-3 outline-none text-white placeholder:text-zinc-500 disabled:opacity-50"
                    />
                    <button
                        type="submit"
                        disabled={!inputValue.trim() || state !== 'idle'}
                        className="p-3 rounded-xl bg-blue-500 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
                    >
                        {state === 'sending' ? (
                            <Loader2 size={20} className="animate-spin" />
                        ) : (
                            <Send size={20} />
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
