export interface Term {
    id: string; // uuid
    content: string; // The word or phrase
    definition: string;
    context?: string; // Example sentence or notes
    createdAt: number;
}

export interface Progress {
    termId: string;
    nextReview: number; // Timestamp of next review
    interval: number; // Current interval in days
    repetition: number; // Number of successful repetitions
    efactor: number; // Easiness factor (SM-2)
    history: { date: number; grade: number }[];
}

export interface Settings {
    id?: number; // Singleton (always 1)
    apiKey: string;
    apiBaseUrl: string;
    model: string;
    language: string; // Target language for AI interaction
    aiEnabled: boolean;
    xp: number; // Gamification
}

export interface QuizGeneration {
    question: string;
    type: 'definition' | 'context' | 'scenario' | 'multiple_choice' | 'cloze';
    options?: string[]; // 4 options for multiple choice
}

export interface QuizEvaluation {
    grade: number; // 0-5
    feedback: string;
    correctAnswer: string;
}

export type StudyState = 'selection' | 'loading' | 'ready' | 'question' | 'evaluating' | 'feedback' | 'finished' | 'error';
