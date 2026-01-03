'use client';

import { motion } from 'framer-motion';
import { MessageSquare, Trash2, Clock } from 'lucide-react';
import { MentorChatSession } from '@/lib/types';
import { useT } from '@/lib/useTranslations';

interface SessionListProps {
    sessions: MentorChatSession[];
    currentSessionId: string | null;
    onSelectSession: (sessionId: string) => void;
    onDeleteSession: (sessionId: string) => void;
    onNewChat: () => void;
}

export function SessionList({
    sessions,
    currentSessionId,
    onSelectSession,
    onDeleteSession,
    onNewChat
}: SessionListProps) {
    const t = useT('mentor');

    return (
        <div className="space-y-3">
            <button
                onClick={onNewChat}
                className="w-full p-4 rounded-2xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 hover:border-blue-500/50 transition-all text-left group"
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 group-hover:bg-blue-500/30 transition-colors">
                        <MessageSquare size={20} />
                    </div>
                    <div className="flex-1">
                        <p className="font-bold text-white">{t('sessions.new')}</p>
                        <p className="text-xs text-zinc-400">Pick any topic to explore</p>
                    </div>
                </div>
            </button>

            {sessions.map((session) => (
                <motion.div
                    key={session.id}
                    whileHover={{ scale: 1.01 }}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                        currentSessionId === session.id
                            ? 'bg-blue-500/10 border-blue-500/40'
                            : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                >
                    <div
                        className="flex items-start justify-between gap-3"
                        onClick={() => onSelectSession(session.id)}
                    >
                        <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-white truncate">{session.topic}</h3>
                            <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500">
                                <span className="flex items-center gap-1">
                                    <Clock size={12} />
                                    {new Date(session.updatedAt).toLocaleDateString()}
                                </span>
                                <span>{session.messageCount} messages</span>
                                <span className="text-blue-400">+{session.xpEarned} XP</span>
                            </div>
                        </div>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDeleteSession(session.id);
                            }}
                            className="p-2 hover:bg-red-500/10 rounded-lg text-zinc-500 hover:text-red-400 transition-colors"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </motion.div>
            ))}

            {sessions.length === 0 && (
                <div className="text-center py-8">
                    <MessageSquare size={32} className="mx-auto text-zinc-600 mb-3" />
                    <p className="text-zinc-500 text-sm">{t('sessions.empty')}</p>
                    <p className="text-zinc-600 text-xs mt-1">Start exploring a new topic!</p>
                </div>
            )}
        </div>
    );
}
