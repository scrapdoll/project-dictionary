import { useState, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { mentorService } from '@/lib/services/mentor-service';
import { mentorChatResponse, evaluateMentorQuiz } from '@/lib/ai-mentor';
import { MentorChatMessage, MentorQuiz, MentorChatSession, ChatState } from '@/lib/types';

export function useMentorChat() {
    const settings = useLiveQuery(() => db.settings.get(1));
    const [sessions, setSessions] = useState<MentorChatSession[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [currentSession, setCurrentSession] = useState<MentorChatSession | null>(null);
    const [messages, setMessages] = useState<MentorChatMessage[]>([]);
    const [state, setState] = useState<ChatState>('idle');
    const [currentQuiz, setCurrentQuiz] = useState<MentorQuiz | null>(null);
    const [currentQuizMessageId, setCurrentQuizMessageId] = useState<string | null>(null);
    const [quizAnswer, setQuizAnswer] = useState('');
    const [error, setError] = useState('');
    const [topic, setTopic] = useState('');

    // Load sessions
    const loadSessions = useCallback(async () => {
        const allSessions = await mentorService.getAllSessions();
        setSessions(allSessions);
    }, []);

    // Start new chat
    const startNewChat = useCallback(async (newTopic: string) => {
        if (!settings?.apiKey) {
            setError('AI configuration required. Please check settings.');
            setState('error');
            return;
        }

        setState('sending');
        setTopic(newTopic);
        setMessages([]);
        setCurrentQuiz(null);
        setError('');

        try {
            const sessionId = await mentorService.createSession(
                newTopic,
                settings.language || 'en-US'
            );
            setCurrentSessionId(sessionId);

            // Refresh sessions list
            const allSessions = await mentorService.getAllSessions();
            setSessions(allSessions);

            // Initial AI greeting
            const response = await mentorChatResponse(
                newTopic,
                `Hello! I want to learn about ${newTopic}.`,
                [],
                settings.apiKey,
                settings.model,
                settings.apiBaseUrl,
                settings.language || 'en-US'
            );

            // Add assistant greeting
            await mentorService.addMessage(sessionId, {
                role: 'assistant',
                content: response.message,
                timestamp: Date.now(),
                quiz: response.shouldCreateQuiz && response.quiz ? {
                    id: crypto.randomUUID(),
                    ...response.quiz,
                    completed: false
                } : undefined
            });

            await loadSessionMessages(sessionId);
            setState('idle');

            if (response.shouldCreateQuiz && response.quiz) {
                setCurrentQuiz({
                    id: crypto.randomUUID(),
                    ...response.quiz,
                    completed: false
                });
                setState('quiz');
            }
        } catch (err) {
            console.error('Failed to start chat:', err);
            setError('Failed to start mentor session. Please check your connection.');
            setState('error');
        }
    }, [settings]);

    // Load existing session
    const loadSession = useCallback(async (sessionId: string) => {
        setCurrentSessionId(sessionId);
        await loadSessionMessages(sessionId);
    }, []);

    const loadSessionMessages = async (sessionId: string) => {
        const sessionMessages = await mentorService.getSessionMessages(sessionId);
        setMessages(sessionMessages);

        const session = await mentorService.getSession(sessionId);
        setCurrentSession(session || null);
        setTopic(session?.topic || '');

        // Find pending quiz
        const pendingQuiz = sessionMessages.find(m => m.quiz && !m.quiz.completed);
        if (pendingQuiz?.quiz) {
            setCurrentQuiz(pendingQuiz.quiz);
            setCurrentQuizMessageId(pendingQuiz.id);
            setState('quiz');
        } else {
            setState('idle');
        }
    };

    // Send user message
    const sendMessage = useCallback(async (content: string) => {
        if (!currentSessionId || !settings) return;

        setState('sending');
        setError('');

        try {
            // Add user message
            await mentorService.addMessage(currentSessionId, {
                role: 'user',
                content,
                timestamp: Date.now()
            });

            setState('receiving');

            // Get AI response
            const response = await mentorChatResponse(
                topic,
                content,
                messages,
                settings.apiKey,
                settings.model,
                settings.apiBaseUrl,
                settings.language || 'en-US'
            );

            // Add assistant message
            const messageId = await mentorService.addMessage(currentSessionId, {
                role: 'assistant',
                content: response.message,
                timestamp: Date.now(),
                quiz: response.shouldCreateQuiz && response.quiz ? {
                    id: crypto.randomUUID(),
                    ...response.quiz,
                    completed: false
                } : undefined
            });

            await loadSessionMessages(currentSessionId);

            if (response.shouldCreateQuiz && response.quiz) {
                setCurrentQuiz({
                    id: crypto.randomUUID(),
                    ...response.quiz,
                    completed: false
                });
                setCurrentQuizMessageId(messageId);
                setState('quiz');
            } else {
                setState('idle');
            }
        } catch (err) {
            console.error('Failed to send message:', err);
            setError('Failed to send message. Please try again.');
            setState('error');
        }
    }, [currentSessionId, settings, messages, topic]);

    // Submit quiz answer
    const submitQuizAnswer = useCallback(async () => {
        if (!currentQuiz || !currentSessionId || !currentQuizMessageId || !settings) return;

        setState('evaluating');

        try {
            const evaluation = await evaluateMentorQuiz(
                currentQuiz,
                quizAnswer,
                settings.apiKey,
                settings.model,
                settings.apiBaseUrl,
                settings.language || 'en-US'
            );

            const updatedQuiz: MentorQuiz = {
                ...currentQuiz,
                userAnswer: quizAnswer,
                evaluation,
                completed: true
            };

            await mentorService.updateQuiz(
                currentSessionId,
                currentQuizMessageId,
                updatedQuiz
            );

            setCurrentQuiz(updatedQuiz);
            await loadSessionMessages(currentSessionId);
            setState('idle');
        } catch (err) {
            console.error('Failed to evaluate quiz:', err);
            setError('Failed to evaluate answer. Please try again.');
            setState('error');
        }
    }, [currentQuiz, currentSessionId, currentQuizMessageId, settings, quizAnswer]);

    // Continue after quiz
    const continueAfterQuiz = useCallback(() => {
        setCurrentQuiz(null);
        setCurrentQuizMessageId(null);
        setQuizAnswer('');
        setState('idle');
    }, []);

    // Clear error
    const clearError = useCallback(() => {
        setError('');
        setState('idle');
    }, []);

    return {
        sessions,
        loadSessions,
        currentSession,
        messages,
        state,
        currentQuiz,
        quizAnswer,
        setQuizAnswer,
        error,
        startNewChat,
        loadSession,
        sendMessage,
        submitQuizAnswer,
        continueAfterQuiz,
        clearError
    };
}
