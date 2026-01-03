/**
 * useMentorQuizzes Hook
 * Manages quiz state for the mentor chat system
 *
 * Handles:
 * - Current quiz tracking
 * - Quiz message association
 * - User quiz answers
 * - Quiz completion state
 */

import { useState, useCallback } from 'react';
import { MentorQuiz } from '@/lib/types';

export interface MentorQuizzesState {
    /** The currently active quiz */
    currentQuiz: MentorQuiz | null;
    /** ID of the message that contains the quiz */
    quizMessageId: string | null;
    /** User's answer to the current quiz */
    quizAnswer: string;
}

export interface MentorQuizzesActions {
    /** Set the current quiz */
    setCurrentQuiz: (quiz: MentorQuiz | null) => void;
    /** Set the quiz message ID */
    setQuizMessageId: (id: string | null) => void;
    /** Set the user's quiz answer */
    setQuizAnswer: (answer: string) => void;
    /** Clear all quiz state */
    clearQuiz: () => void;
    /** Create a new quiz from partial data */
    createQuiz: (quiz: Omit<MentorQuiz, 'id' | 'completed' | 'userAnswer' | 'evaluation'>) => MentorQuiz;
    /** Complete a quiz with evaluation data */
    completeQuiz: (evaluation: MentorQuiz['evaluation']) => void;
}

/**
 * Hook to manage mentor quiz state
 *
 * @example
 * ```tsx
 * const { state, actions } = useMentorQuizzes();
 *
 * // Create a new quiz from AI response
 * const quiz = actions.createQuiz({
 *   type: 'multiple_choice',
 *   question: 'What is X?',
 *   options: ['A', 'B', 'C', 'D']
 * });
 * actions.setCurrentQuiz(quiz);
 *
 * // Submit and complete quiz
 * actions.setQuizAnswer('A');
 * const evaluation = await evaluateQuiz(quiz, 'A');
 * actions.completeQuiz(evaluation);
 * ```
 */
export function useMentorQuizzes() {
    const [currentQuiz, setCurrentQuiz] = useState<MentorQuiz | null>(null);
    const [quizMessageId, setQuizMessageId] = useState<string | null>(null);
    const [quizAnswer, setQuizAnswer] = useState('');

    const clearQuiz = useCallback(() => {
        setCurrentQuiz(null);
        setQuizMessageId(null);
        setQuizAnswer('');
    }, []);

    const createQuiz = useCallback((
        quizData: Omit<MentorQuiz, 'id' | 'completed' | 'userAnswer' | 'evaluation'>
    ): MentorQuiz => {
        return {
            ...quizData,
            id: crypto.randomUUID(),
            completed: false
        };
    }, []);

    const completeQuiz = useCallback((evaluation: MentorQuiz['evaluation']) => {
        if (!currentQuiz) return;

        setCurrentQuiz({
            ...currentQuiz,
            userAnswer: quizAnswer,
            evaluation,
            completed: true
        });
    }, [currentQuiz, quizAnswer]);

    return {
        // State
        currentQuiz,
        quizMessageId,
        quizAnswer,

        // Actions
        setCurrentQuiz,
        setQuizMessageId,
        setQuizAnswer,
        clearQuiz,
        createQuiz,
        completeQuiz
    };
}

/**
 * Type alias for the full return value
 */
export type UseMentorQuizzesReturn = ReturnType<typeof useMentorQuizzes>;
