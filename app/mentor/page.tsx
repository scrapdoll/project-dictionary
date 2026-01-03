'use client';

import { useEffect, useState } from 'react';
import { Brain, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { useMentorChat } from '@/hooks/useMentorChat';
import { ChatInterface } from '@/components/mentor/ChatInterface';
import { SessionList } from '@/components/mentor/SessionList';
import { useT } from '@/lib/useTranslations';

export default function MentorPage() {
    const t = useT('mentor');
    const {
        sessions,
        loadSessions,
        messages,
        state,
        currentQuiz,
        error,
        startNewChat,
        loadSession,
        sendMessage,
        submitQuizAnswer,
        continueAfterQuiz,
        clearError,
        socraticQuestion,
        toolAction,
        termSuggestions,
        addTermToDictionary
    } = useMentorChat();

    const [showNewTopicModal, setShowNewTopicModal] = useState(false);
    const [newTopic, setNewTopic] = useState('');
    const [view, setView] = useState<'list' | 'chat'>('list');

    useEffect(() => {
        loadSessions();
    }, [loadSessions]);

    const handleStartChat = async () => {
        if (newTopic.trim()) {
            await startNewChat(newTopic.trim());
            setShowNewTopicModal(false);
            setNewTopic('');
            setView('chat');
        }
    };

    const handleSelectSession = async (sessionId: string) => {
        await loadSession(sessionId);
        setView('chat');
    };

    const handleNewChat = () => {
        setShowNewTopicModal(true);
    };

    const handleBackToList = () => {
        setView('list');
    };

    const handleDeleteSession = async (sessionId: string) => {
        const { mentorService } = await import('@/lib/services/mentor-service');
        await mentorService.deleteSession(sessionId);
        await loadSessions();
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <header className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center text-purple-400">
                        <Brain size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">{t('title')}</h1>
                        <p className="text-sm text-zinc-400">{t('subtitle')}</p>
                    </div>
                </div>

                {view === 'chat' && (
                    <button
                        onClick={handleBackToList}
                        className="px-4 py-2 rounded-xl bg-zinc-800 text-white font-medium hover:bg-zinc-700 transition-colors flex items-center gap-2"
                    >
                        <ArrowLeft size={16} />
                        Sessions
                    </button>
                )}
            </header>

            {/* Error State */}
            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card p-4 border border-red-500/20 text-red-400"
                >
                    {error}
                </motion.div>
            )}

            {/* View: Session List */}
            {view === 'list' && (
                <SessionList
                    sessions={sessions}
                    currentSessionId={null}
                    onSelectSession={handleSelectSession}
                    onDeleteSession={handleDeleteSession}
                    onNewChat={handleNewChat}
                />
            )}

            {/* View: Chat Interface */}
            {view === 'chat' && (
                <ChatInterface
                    messages={messages}
                    currentQuiz={currentQuiz}
                    state={state}
                    error={error}
                    toolAction={toolAction}
                    termSuggestions={termSuggestions}
                    onSendMessage={sendMessage}
                    onQuizAnswer={submitQuizAnswer}
                    onContinue={continueAfterQuiz}
                    onClearError={clearError}
                    onAddTerm={addTermToDictionary}
                    onDismissToolAction={() => {}}
                />
            )}

            {/* New Topic Modal */}
            {showNewTopicModal && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={() => setShowNewTopicModal(false)}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="glass-card p-6 w-full max-w-md"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-xl font-bold mb-4">What would you like to learn?</h2>
                        <input
                            type="text"
                            value={newTopic}
                            onChange={(e) => setNewTopic(e.target.value)}
                            placeholder="e.g., Quantum Physics, Spanish Grammar, React Hooks..."
                            className="glass-input mb-4"
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && handleStartChat()}
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowNewTopicModal(false)}
                                className="flex-1 py-3 rounded-xl bg-zinc-800 font-bold hover:bg-zinc-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleStartChat}
                                disabled={!newTopic.trim()}
                                className="flex-1 py-3 rounded-xl bg-blue-500 text-white font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Start Learning
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </div>
    );
}
