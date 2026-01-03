/**
 * useMentorChat Hook
 * Main orchestrator hook for the mentor chat system
 *
 * This hook composes smaller, focused hooks to provide a complete
 * mentor chat experience with:
 * - Socratic method teaching
 * - Quiz generation and evaluation
 * - Tool actions (add term, highlight concept, suggest practice)
 * - Session management
 *
 * @example
 * ```tsx
 * function MentorChat() {
 *   const {
 *     messages,
 *     state,
 *     currentQuiz,
 *     toolAction,
 *     sendMessage,
 *     submitQuizAnswer
 *   } = useMentorChat();
 *
 *   return <ChatInterface {...} />;
 * }
 * ```
 */

import { useCallback, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { mentorService } from '@/lib/services/mentor-service';
import { socraticMentorResponse, evaluateSocraticQuiz, extractTermSuggestions } from '@/lib/ai-socratic';
import { MentorChatMessage, MentorQuiz, ChatState, MentorToolAction } from '@/lib/types';
import {
    useMentorChatState,
    useMentorQuizzes,
    useMentorTools,
    type TermSuggestion
} from './mentor';

export function useMentorChat() {
    // Compose smaller hooks for focused state management
    const chat = useMentorChatState();
    const quizzes = useMentorQuizzes();
    const tools = useMentorTools();

    // Get settings and terms from database
    const settings = useLiveQuery(() => db.settings.get(1));
    const allTerms = useLiveQuery(() => db.terms.toArray());

    /**
     * Load all chat sessions from the database
     */
    const loadSessions = useCallback(async () => {
        const allSessions = await mentorService.getAllSessions();
        chat.setSessions(allSessions);
    }, [chat]);

    /**
     * Save an assistant message to the session
     *
     * Handles saving messages that may have content, tool actions, or quizzes.
     * Returns the message ID if saved, undefined otherwise.
     */
    const saveAssistantMessage = useCallback(async (
        sessionId: string,
        response: Awaited<ReturnType<typeof socraticMentorResponse>>
    ): Promise<string | undefined> => {
        // Build message content with Socratic question
        let messageContent = response.message;
        if (response.socraticQuestion) {
            messageContent += '\n\n' + response.socraticQuestion;
            tools.setSocraticQuestion(response.socraticQuestion);
        }

        // Save message if we have content, tool action, or quiz
        const hasToolAction = response.toolAction !== undefined;
        const hasQuiz = response.shouldCreateQuiz && response.quiz;
        if (messageContent.trim().length > 0 || hasToolAction || hasQuiz) {
            return await mentorService.addMessage(sessionId, {
                role: 'assistant',
                content: messageContent,
                timestamp: Date.now(),
                quiz: hasQuiz ? {
                    id: crypto.randomUUID(),
                    ...response.quiz,
                    completed: false
                } : undefined
            });
        }

        return undefined;
    }, [tools.setSocraticQuestion]);

    /**
     * Start a new mentor chat session
     */
    const startNewChat = useCallback(async (newTopic: string) => {
        if (!settings?.apiKey) {
            chat.setError('AI configuration required. Please check settings.');
            chat.setState('error');
            return;
        }

        chat.setState('sending');
        chat.setTopic(newTopic);
        chat.setMessages([]);
        quizzes.clearQuiz();
        chat.setError('');
        tools.clearSocraticQuestion();
        tools.setToolAction(null);

        try {
            const sessionId = await mentorService.createSession(
                newTopic,
                settings.language || 'en-US'
            );
            chat.setCurrentSessionId(sessionId);

            // Refresh sessions list
            await loadSessions();

            // Initial AI greeting with Socratic method
            const response = await socraticMentorResponse(
                newTopic,
                `Hello! I want to learn about ${newTopic}.`,
                [],
                settings.apiKey,
                settings.model,
                settings.apiBaseUrl,
                settings.language || 'en-US',
                (allTerms || []).map(t => t.content)
            );

            // Save assistant message (handles content, tool actions, and quizzes)
            await saveAssistantMessage(sessionId, response);

            // Handle tool action if present
            if (response.toolAction) {
                tools.setToolAction(response.toolAction);
            }

            await loadSessionMessages(sessionId);
            chat.setState('idle');

            if (response.shouldCreateQuiz && response.quiz) {
                const quiz = quizzes.createQuiz(response.quiz);
                quizzes.setCurrentQuiz(quiz);
                chat.setState('quiz');
            }
        } catch (err) {
            console.error('Failed to start chat:', err);
            chat.setError('Failed to start mentor session. Please check your connection.');
            chat.setState('error');
        }
    }, [settings, chat, quizzes, tools, allTerms, loadSessions, saveAssistantMessage]);

    /**
     * Load an existing chat session
     */
    const loadSession = useCallback(async (sessionId: string) => {
        chat.setCurrentSessionId(sessionId);
        await loadSessionMessages(sessionId);
    }, [chat]);

    /**
     * Load messages for a session
     */
    const loadSessionMessages = async (sessionId: string) => {
        const sessionMessages = await mentorService.getSessionMessages(sessionId);
        chat.setMessages(sessionMessages);

        const session = await mentorService.getSession(sessionId);
        chat.setCurrentSession(session || null);
        chat.setTopic(session?.topic || '');

        // Find pending quiz
        const pendingQuiz = sessionMessages.find(m => m.quiz && !m.quiz.completed);
        if (pendingQuiz?.quiz) {
            quizzes.setCurrentQuiz(pendingQuiz.quiz);
            quizzes.setQuizMessageId(pendingQuiz.id);
            chat.setState('quiz');
        } else {
            chat.setState('idle');
        }
    };

    /**
     * Send a user message
     */
    const sendMessage = useCallback(async (content: string) => {
        if (!chat.currentSessionId || !settings) return;

        chat.setState('sending');
        chat.setError('');
        tools.clearSocraticQuestion();
        tools.setToolAction(null);

        try {
            // Add user message
            await mentorService.addMessage(chat.currentSessionId, {
                role: 'user',
                content,
                timestamp: Date.now()
            });

            chat.setState('receiving');

            // Get Socratic AI response
            const response = await socraticMentorResponse(
                chat.topic,
                content,
                chat.messages,
                settings.apiKey,
                settings.model,
                settings.apiBaseUrl,
                settings.language || 'en-US',
                (allTerms || []).map(t => t.content)
            );

            // Save assistant message (handles content, tool actions, and quizzes)
            const messageId = await saveAssistantMessage(chat.currentSessionId, response);

            // Handle tool action
            if (response.toolAction) {
                tools.setToolAction(response.toolAction);
            }

            // Extract term suggestions from conversation
            const updatedMessages: MentorChatMessage[] = [
                ...chat.messages,
                {
                    id: crypto.randomUUID(),
                    sessionId: chat.currentSessionId,
                    role: 'user' as const,
                    content,
                    timestamp: Date.now()
                }
            ];
            const existingTermNames = (allTerms || []).map(t => t.content);
            const suggestions = extractTermSuggestions(updatedMessages, existingTermNames);
            if (suggestions.length > 0) {
                tools.setTermSuggestions(suggestions);
            }

            await loadSessionMessages(chat.currentSessionId);

            if (response.shouldCreateQuiz && response.quiz) {
                const quiz = quizzes.createQuiz(response.quiz);
                quizzes.setCurrentQuiz(quiz);
                quizzes.setQuizMessageId(messageId || null);
                chat.setState('quiz');
            } else {
                chat.setState('idle');
            }
        } catch (err) {
            console.error('Failed to send message:', err);
            chat.setError('Failed to send message. Please try again.');
            chat.setState('error');
        }
    }, [chat, quizzes, tools, settings, allTerms, saveAssistantMessage]);

    /**
     * Submit a quiz answer for evaluation
     */
    const submitQuizAnswer = useCallback(async (answer: string) => {
        if (!quizzes.currentQuiz || !chat.currentSessionId || !quizzes.quizMessageId || !settings) return;

        chat.setState('evaluating');
        quizzes.setQuizAnswer(answer);

        try {
            const evaluation = await evaluateSocraticQuiz(
                quizzes.currentQuiz,
                answer,
                settings.apiKey,
                settings.model,
                settings.apiBaseUrl,
                settings.language || 'en-US'
            );

            const updatedQuiz: MentorQuiz = {
                ...quizzes.currentQuiz,
                userAnswer: answer,
                evaluation,
                completed: true
            };

            await mentorService.updateQuiz(
                chat.currentSessionId,
                quizzes.quizMessageId,
                updatedQuiz
            );

            quizzes.setCurrentQuiz(updatedQuiz);
            await loadSessionMessages(chat.currentSessionId);
            chat.setState('idle');
        } catch (err) {
            console.error('Failed to evaluate quiz:', err);
            chat.setError('Failed to evaluate answer. Please try again.');
            chat.setState('error');
        }
    }, [chat, quizzes, settings]);

    /**
     * Add a term to the dictionary from tool action
     */
    const addTermToDictionary = useCallback(async (term: string, definition: string, context?: string) => {
        try {
            const { db } = await import('@/lib/db');
            await db.terms.add({
                id: crypto.randomUUID(),
                content: term,
                definition,
                context,
                createdAt: Date.now()
            });

            // Initialize progress
            await db.progress.add({
                termId: term,
                nextReview: Date.now(),
                interval: 0,
                repetition: 0,
                efactor: 2.5,
                history: []
            });

            tools.setToolAction(null);
            return true;
        } catch (err) {
            console.error('Failed to add term:', err);
            chat.setError('Failed to add term to dictionary.');
            return false;
        }
    }, [chat, tools]);

    /**
     * Continue chatting after quiz completion
     */
    const continueAfterQuiz = useCallback(() => {
        quizzes.clearQuiz();
        chat.setState('idle');
    }, [chat, quizzes]);

    // Load sessions on mount
    useEffect(() => {
        loadSessions();
    }, [loadSessions]);

    return {
        // Session state
        sessions: chat.sessions,
        loadSessions,
        currentSession: chat.currentSession,
        messages: chat.messages,

        // Chat state
        state: chat.state,
        error: chat.error,

        // Quiz state
        currentQuiz: quizzes.currentQuiz,

        // Tool state
        socraticQuestion: tools.socraticQuestion,
        toolAction: tools.toolAction,
        termSuggestions: tools.termSuggestions,

        // Actions
        startNewChat,
        loadSession,
        sendMessage,
        submitQuizAnswer,
        continueAfterQuiz,
        clearError: chat.clearError,
        addTermToDictionary
    };
}
