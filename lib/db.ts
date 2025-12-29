import Dexie, { type EntityTable } from 'dexie';

import { Term, Progress, Settings } from './types';

export type { Term, Progress, Settings };


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

export async function importDatabase(data: any) {
    if (!data.terms || !data.progress) {
        throw new Error('Invalid backup file format');
    }

    await db.transaction('rw', db.terms, db.progress, async () => {
        await db.terms.clear();
        await db.progress.clear();
        await db.terms.bulkAdd(data.terms);
        await db.progress.bulkAdd(data.progress);
    });
}

export { db };
