/**
 * useMentorChatState Hook
 * Manages the core state for the mentor chat system
 *
 * Handles:
 * - Chat messages and history
 * - Current session tracking
 * - Chat state machine (idle, sending, receiving, quiz, error)
 * - Error handling
 * - Topic tracking
 */

import { useState, useCallback } from 'react';
import { MentorChatMessage, MentorChatSession, ChatState } from '@/lib/types';

export interface MentorChatStateValue {
    // Session tracking
    sessions: MentorChatSession[];
    currentSessionId: string | null;
    currentSession: MentorChatSession | null;

    // Messages
    messages: MentorChatMessage[];

    // State machine
    state: ChatState;
    error: string;

    // Topic
    topic: string;
}

export interface MentorChatStateActions {
    // Session management
    setSessions: (sessions: MentorChatSession[]) => void;
    setCurrentSessionId: (id: string | null) => void;
    setCurrentSession: (session: MentorChatSession | null) => void;

    // Message management
    setMessages: (messages: MentorChatMessage[]) => void;
    addMessage: (message: MentorChatMessage) => void;

    // State management
    setState: (state: ChatState) => void;
    setError: (error: string) => void;
    clearError: () => void;

    // Topic
    setTopic: (topic: string) => void;
}

/**
 * Hook to manage mentor chat state
 *
 * @example
 * ```tsx
 * const { state, actions } = useMentorChatState();
 *
 * // Start a new chat
 * actions.setState('sending');
 * actions.setTopic('Python programming');
 * ```
 */
export function useMentorChatState() {
    const [sessions, setSessions] = useState<MentorChatSession[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [currentSession, setCurrentSession] = useState<MentorChatSession | null>(null);
    const [messages, setMessages] = useState<MentorChatMessage[]>([]);
    const [state, setState] = useState<ChatState>('idle');
    const [error, setError] = useState('');
    const [topic, setTopic] = useState('');

    const clearError = useCallback(() => {
        setError('');
        if (state === 'error') {
            setState('idle');
        }
    }, [state]);

    const addMessage = useCallback((message: MentorChatMessage) => {
        setMessages(prev => [...prev, message]);
    }, []);

    return {
        // State
        sessions,
        currentSessionId,
        currentSession,
        messages,
        state,
        error,
        topic,

        // Actions
        setSessions,
        setCurrentSessionId,
        setCurrentSession,
        setMessages,
        addMessage,
        setState,
        setError,
        clearError,
        setTopic
    };
}

/**
 * Type alias for the full return value
 */
export type UseMentorChatStateReturn = ReturnType<typeof useMentorChatState>;
