/**
 * useMentorTools Hook
 * Manages tool actions for the mentor chat system
 *
 * Handles:
 * - Active tool actions (add_term, create_quiz, highlight_concept, suggest_practice)
 * - Term suggestions extracted from conversation
 * - Socratic questions
 */

import { useState, useCallback } from 'react';
import { MentorToolAction } from '@/lib/types';

export interface TermSuggestion {
    term: string;
    definition: string;
    context: string;
}

export interface MentorToolsState {
    /** The current active tool action from the AI */
    toolAction: MentorToolAction | null;
    /** Extracted term suggestions from the conversation */
    termSuggestions: TermSuggestion[];
    /** The current Socratic question to guide the user */
    socraticQuestion: string | null;
}

export interface MentorToolsActions {
    /** Set the current tool action */
    setToolAction: (action: MentorToolAction | null) => void;
    /** Dismiss/clear the current tool action */
    dismissToolAction: () => void;
    /** Set term suggestions */
    setTermSuggestions: (suggestions: TermSuggestion[]) => void;
    /** Add a single term suggestion */
    addTermSuggestion: (suggestion: TermSuggestion) => void;
    /** Clear all term suggestions */
    clearTermSuggestions: () => void;
    /** Set the Socratic question */
    setSocraticQuestion: (question: string | null) => void;
    /** Clear the Socratic question */
    clearSocraticQuestion: () => void;
}

/**
 * Hook to manage mentor tool actions
 *
 * @example
 * ```tsx
 * const { state, actions } = useMentorTools();
 *
 * // Show a tool action from AI response
 * if (response.toolAction) {
 *   actions.setToolAction(response.toolAction);
 * }
 *
 * // User dismisses the action
 * actions.dismissToolAction();
 *
 * // Add term suggestions from conversation
 * actions.setTermSuggestions(suggestions);
 * ```
 */
export function useMentorTools() {
    const [toolAction, setToolAction] = useState<MentorToolAction | null>(null);
    const [termSuggestions, setTermSuggestions] = useState<TermSuggestion[]>([]);
    const [socraticQuestion, setSocraticQuestion] = useState<string | null>(null);

    const dismissToolAction = useCallback(() => {
        setToolAction(null);
    }, []);

    const addTermSuggestion = useCallback((suggestion: TermSuggestion) => {
        setTermSuggestions(prev => {
            // Avoid duplicates
            const exists = prev.some(s => s.term.toLowerCase() === suggestion.term.toLowerCase());
            if (exists) return prev;
            return [...prev, suggestion];
        });
    }, []);

    const clearTermSuggestions = useCallback(() => {
        setTermSuggestions([]);
    }, []);

    const clearSocraticQuestion = useCallback(() => {
        setSocraticQuestion(null);
    }, []);

    return {
        // State
        toolAction,
        termSuggestions,
        socraticQuestion,

        // Actions
        setToolAction,
        dismissToolAction,
        setTermSuggestions,
        addTermSuggestion,
        clearTermSuggestions,
        setSocraticQuestion,
        clearSocraticQuestion
    };
}

/**
 * Type alias for the full return value
 */
export type UseMentorToolsReturn = ReturnType<typeof useMentorTools>;
