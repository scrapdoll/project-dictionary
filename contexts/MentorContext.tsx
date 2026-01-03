'use client';

/**
 * MentorContext Provider
 *
 * Provides mentor chat state to all mentor-related components
 * without prop drilling. Manages chat sessions, messages, quizzes,
 * and tool actions.
 *
 * @example
 * ```tsx
 * function App() {
 *   return (
 *     <MentorProvider>
 *       <ChatInterface />
 *     </MentorProvider>
 *   );
 * }
 *
 * function ChatInterface() {
 *   const { messages, currentQuiz, sendMessage } = useMentorContext();
 *   // ...
 * }
 * ```
 */

import React, { createContext, useContext, ReactNode } from 'react';
import {
    MentorChatMessage,
    MentorChatSession,
    MentorQuiz,
    ChatState,
    MentorToolAction
} from '@/lib/types';
import type { TermSuggestion } from '@/hooks/mentor';

export interface MentorContextValue {
    // Session state
    currentSessionId: string | null;
    currentSession: MentorChatSession | null;
    sessions: MentorChatSession[];

    // Message state
    messages: MentorChatMessage[];

    // Chat state
    state: ChatState;
    error: string;
    topic: string;

    // Quiz state
    currentQuiz: MentorQuiz | null;
    quizAnswer: string;

    // Tool state
    toolAction: MentorToolAction | null;
    termSuggestions: TermSuggestion[];
    socraticQuestion: string | null;

    // Note: Actions are provided by useMentorChat hook
    // This context is primarily for sharing state between components
}

const MentorContext = createContext<MentorContextValue | null>(null);

export interface MentorProviderProps {
    children: ReactNode;
    value: MentorContextValue;
}

/**
 * Provider component for mentor chat state
 *
 * The value should be provided from the useMentorChat hook
 * which handles the actual state management and actions.
 *
 * @example
 * ```tsx
 * function MentorChatWrapper() {
 *   const mentor = useMentorChat();
 *
 *   return (
 *     <MentorProvider value={mentor}>
 *       <ChatInterface />
 *       <QuizPanel />
 *       <ToolActionDialog />
 *     </MentorProvider>
 *   );
 * }
 * ```
 */
export function MentorProvider({ children, value }: MentorProviderProps) {
    return <MentorContext.Provider value={value}>{children}</MentorContext.Provider>;
}

/**
 * Hook to access mentor context
 * Throws error if used outside MentorProvider
 *
 * @example
 * ```tsx
 * const { messages, currentQuiz, state } = useMentorContext();
 * ```
 */
export function useMentorContext(): MentorContextValue {
    const context = useContext(MentorContext);
    if (!context) {
        throw new Error('useMentorContext must be used within MentorProvider');
    }
    return context;
}
