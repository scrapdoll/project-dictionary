'use client';

/**
 * StudyContext Provider
 *
 * Provides study session state to all study-related components
 * without prop drilling. Manages the queue of terms to study,
 * current progress, and session lifecycle.
 *
 * @example
 * ```tsx
 * function App() {
 *   return (
 *     <StudyProvider>
 *       <StudySession />
 *     </StudyProvider>
 *   );
 * }
 *
 * function StudySession() {
 *   const { queue, currentItem, goToNext, endSession } = useStudyContext();
 *   // ...
 * }
 * ```
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Term, Progress } from '@/lib/types';

/**
 * A term with its progress data for study sessions
 */
export type TermWithProgress = {
    term: Term;
    progress: Progress;
};

export type SessionType = 'standard' | 'ai';

export interface StudyContextValue {
    // Queue state
    queue: TermWithProgress[];
    currentIndex: number;
    currentItem: TermWithProgress | null;

    // Session state
    sessionType: SessionType;
    isActive: boolean;

    // Actions
    setQueue: (items: TermWithProgress[]) => void;
    setCurrentIndex: (index: number) => void;
    startSession: (type: SessionType) => void;
    endSession: () => void;
    goToNext: () => void;
    goToPrevious: () => void;
    reset: () => void;
}

const StudyContext = createContext<StudyContextValue | null>(null);

export interface StudyProviderProps {
    children: ReactNode;
}

/**
 * Provider component for study session state
 */
export function StudyProvider({ children }: StudyProviderProps) {
    const [queue, setQueue] = useState<TermWithProgress[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [sessionType, setSessionType] = useState<SessionType>('standard');
    const [isActive, setIsActive] = useState(false);

    const currentItem = queue[currentIndex] || null;

    const startSession = useCallback((type: SessionType) => {
        setSessionType(type);
        setIsActive(true);
        setCurrentIndex(0);
    }, []);

    const endSession = useCallback(() => {
        setIsActive(false);
        setQueue([]);
        setCurrentIndex(0);
    }, []);

    const goToNext = useCallback(() => {
        if (currentIndex < queue.length - 1) {
            setCurrentIndex(prev => prev + 1);
        }
    }, [currentIndex, queue.length]);

    const goToPrevious = useCallback(() => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }
    }, [currentIndex]);

    const reset = useCallback(() => {
        setQueue([]);
        setCurrentIndex(0);
        setIsActive(false);
    }, []);

    const value: StudyContextValue = {
        // State
        queue,
        currentIndex,
        currentItem,
        sessionType,
        isActive,

        // Actions
        setQueue,
        setCurrentIndex,
        startSession,
        endSession,
        goToNext,
        goToPrevious,
        reset
    };

    return <StudyContext.Provider value={value}>{children}</StudyContext.Provider>;
}

/**
 * Hook to access study context
 * Throws error if used outside StudyProvider
 *
 * @example
 * ```tsx
 * const { currentItem, goToNext, endSession } = useStudyContext();
 * ```
 */
export function useStudyContext(): StudyContextValue {
    const context = useContext(StudyContext);
    if (!context) {
        throw new Error('useStudyContext must be used within StudyProvider');
    }
    return context;
}
