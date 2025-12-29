import Dexie, { type EntityTable } from 'dexie';

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
    aiEnabled: boolean;
    xp: number; // Gamification
}

const db = new Dexie('DictionaryAgentDB') as Dexie & {
    terms: EntityTable<Term, 'id'>;
    progress: EntityTable<Progress, 'termId'>;
    settings: EntityTable<Settings, 'id'>;
};

db.version(1).stores({
    terms: 'id, content, createdAt',
    progress: 'termId, nextReview',
    settings: 'id'
});

// version 2 for existing users during dev if needed, or just relying on clean state
db.version(2).stores({
    settings: 'id'
}).upgrade(tx => {
    return tx.table('settings').toCollection().modify(settings => {
        settings.xp = 0;
    });
});

export async function exportDatabase() {
    const terms = await db.terms.toArray();
    const progress = await db.progress.toArray();
    return {
        terms,
        progress,
        exportedAt: Date.now(),
        version: 1
    };
}

export { db };
