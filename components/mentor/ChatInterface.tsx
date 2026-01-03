'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, AlertCircle, X, User } from 'lucide-react';
import { MentorChatMessage, MentorQuiz, ChatState, MentorToolAction } from '@/lib/types';
import { MessageBubble } from './MessageBubble';
import { InteractiveQuiz } from './InteractiveQuiz';
import { TermSuggestionCard } from './TermSuggestionCard';
import { QuizResultCard } from './QuizResultCard';
import { useT } from '@/lib/useTranslations';

interface ChatInterfaceProps {
    messages: MentorChatMessage[];
    currentQuiz: MentorQuiz | null;
    state: ChatState;
    error: string;
    toolAction: MentorToolAction | null;
    termSuggestions: Array<{ term: string; definition: string; context: string }>;
    onSendMessage: (message: string) => void;
    onQuizAnswer: (answer: string) => void;
    onContinue: () => void;
    onClearError: () => void;
    onAddTerm: (term: string, definition: string, context?: string) => Promise<boolean>;
    onDismissToolAction: () => void;
}

export function ChatInterface({
    messages,
    currentQuiz,
    state,
    error,
    toolAction,
    termSuggestions,
    onSendMessage,
    onQuizAnswer,
    onContinue,
    onClearError,
    onAddTerm,
    onDismissToolAction
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

                    {state === 'sending' && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex gap-3 justify-end"
                        >
                            <div className="glass-card px-4 py-3 max-w-[80%] bg-blue-500/10 border-blue-500/20">
                                <div className="flex gap-1 items-center">
                                    <div className="text-sm text-zinc-400">Sending</div>
                                    <div className="flex gap-1">
                                        <motion.div
                                            animate={{ scale: [1, 1.2, 1] }}
                                            transition={{ duration: 0.8, repeat: Infinity, delay: 0 }}
                                            className="w-1.5 h-1.5 bg-blue-400 rounded-full"
                                        />
                                        <motion.div
                                            animate={{ scale: [1, 1.2, 1] }}
                                            transition={{ duration: 0.8, repeat: Infinity, delay: 0.15 }}
                                            className="w-1.5 h-1.5 bg-blue-400 rounded-full"
                                        />
                                        <motion.div
                                            animate={{ scale: [1, 1.2, 1] }}
                                            transition={{ duration: 0.8, repeat: Infinity, delay: 0.3 }}
                                            className="w-1.5 h-1.5 bg-blue-400 rounded-full"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-zinc-400 flex-shrink-0">
                                <User size={16} />
                            </div>
                        </motion.div>
                    )}

                    {state === 'receiving' && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex gap-3"
                        >
                            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 flex-shrink-0 relative">
                                <Loader2 size={16} className="animate-spin" />
                                <motion.div
                                    className="absolute inset-0 rounded-full bg-blue-500/20"
                                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                />
                            </div>
                            <div className="glass-card px-4 py-3 max-w-[80%]">
                                <div className="flex items-center gap-2">
                                    <div className="text-sm text-zinc-400">Thinking</div>
                                    <div className="flex gap-1">
                                        <motion.div
                                            animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                                            transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                                            className="w-2 h-2 bg-blue-400 rounded-full"
                                        />
                                        <motion.div
                                            animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                                            transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                                            className="w-2 h-2 bg-blue-400 rounded-full"
                                        />
                                        <motion.div
                                            animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                                            transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                                            className="w-2 h-2 bg-blue-400 rounded-full"
                                        />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
                <div ref={messagesEndRef} />
            </div>

            {/* Quiz Overlay */}
            <AnimatePresence>
                {/* Tool Action: Add Term Suggestion */}
                {toolAction?.type === 'add_term' && toolAction.data && (
                    <TermSuggestionCard
                        term={toolAction.data.term}
                        definition={toolAction.data.definition}
                        context={toolAction.data.context}
                        onAdd={onAddTerm}
                        onDismiss={onDismissToolAction}
                    />
                )}

                {/* Term Suggestions from conversation */}
                {termSuggestions.length > 0 && !toolAction && (
                    <div className="space-y-2">
                        <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold px-2">
                            Suggested Terms
                        </p>
                        {termSuggestions.map((suggestion, index) => (
                            <TermSuggestionCard
                                key={index}
                                term={suggestion.term}
                                definition={suggestion.definition}
                                context={suggestion.context}
                                onAdd={onAddTerm}
                                onDismiss={() => {
                                    // Remove this suggestion by filtering it out
                                    // This would need to be handled in parent
                                }}
                            />
                        ))}
                    </div>
                )}

                {currentQuiz && !currentQuiz.completed && state === 'quiz' && (
                    <InteractiveQuiz
                        quiz={currentQuiz}
                        onAnswer={onQuizAnswer}
                    />
                )}

                {currentQuiz?.completed && (
                    <QuizResultCard
                        quiz={currentQuiz}
                        onContinue={onContinue}
                    />
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
