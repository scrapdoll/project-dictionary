'use client';

import { motion } from 'framer-motion';
import { User, Bot } from 'lucide-react';
import { MentorChatMessage } from '@/lib/types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MessageBubbleProps {
    message: MentorChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
    const isUser = message.role === 'user';

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
        >
            {!isUser && (
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 flex-shrink-0">
                    <Bot size={16} />
                </div>
            )}

            <div className={`max-w-[80%] ${isUser ? 'order-first' : ''}`}>
                <div className={`glass-card px-4 py-3 ${
                    isUser
                        ? 'bg-blue-500/10 border-blue-500/20'
                        : 'bg-white/5 border-white/10'
                }`}>
                    <div className="prose prose-invert prose-sm max-w-none
                        prose-headings:text-zinc-100 prose-headings:font-semibold
                        prose-p:text-zinc-100 prose-p:leading-relaxed
                        prose-strong:text-zinc-100 prose-strong:font-semibold
                        prose-em:text-zinc-300
                        prose-code:text-blue-300 prose-code:bg-blue-500/10 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
                        prose-pre:bg-zinc-900 prose-pre:border prose-pre:border-zinc-700
                        prose-ul:text-zinc-100 prose-li:text-zinc-100
                        prose-ol:text-zinc-100
                        prose-a:text-blue-400 prose-a:no-underline hover:prose-a:text-blue-300
                        prose-blockquote:text-zinc-300 prose-blockquote:border-zinc-600">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {message.content}
                        </ReactMarkdown>
                    </div>
                </div>

                {message.quiz && message.quiz.completed && (
                    <div className="mt-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <p className="text-xs text-emerald-400 font-semibold">
                            Quiz completed: Grade {message.quiz.evaluation?.grade}/5
                        </p>
                    </div>
                )}
            </div>

            {isUser && (
                <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-zinc-400 flex-shrink-0">
                    <User size={16} />
                </div>
            )}
        </motion.div>
    );
}
