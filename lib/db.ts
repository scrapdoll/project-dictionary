import Dexie, { type EntityTable } from 'dexie';

import { Term, Progress, Settings, MentorChatSession, MentorChatMessage } from './types';

export type { Term, Progress, Settings };

// Type definition for database export format
export interface DatabaseExport {
    terms: Term[];
    progress: Progress[];
    mentorChatSessions?: MentorChatSession[];
    mentorChatMessages?: MentorChatMessage[];
    exportedAt: number;
    version: number;
}


const db = new Dexie('DictionaryAgentDB') as Dexie & {
    terms: EntityTable<Term, 'id'>;
    progress: EntityTable<Progress, 'termId'>;
    settings: EntityTable<Settings, 'id'>;
    mentorChatSessions: EntityTable<MentorChatSession, 'id'>;
    mentorChatMessages: EntityTable<MentorChatMessage, 'id'>;
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

// version 3 adds mentor chat tables
db.version(3).stores({
    mentorChatSessions: 'id, topic, createdAt, updatedAt',
    mentorChatMessages: 'id, sessionId, timestamp'
});

export async function exportDatabase(): Promise<DatabaseExport> {
    const [terms, progress, mentorChatSessions, mentorChatMessages] = await Promise.all([
        db.terms.toArray(),
        db.progress.toArray(),
        db.mentorChatSessions.toArray(),
        db.mentorChatMessages.toArray(),
    ]);

    return {
        terms,
        progress,
        mentorChatSessions,
        mentorChatMessages,
        exportedAt: Date.now(),
        version: 3
    };
}

export async function importDatabase(data: DatabaseExport) {
    if (!data.terms || !data.progress) {
        throw new Error('Invalid backup file format: missing terms or progress');
    }

    // Determine which tables are included in the export (for backward compatibility)
    const hasMentorData = data.mentorChatSessions && data.mentorChatMessages;
    const tablesToClear = hasMentorData
        ? [db.terms, db.progress, db.mentorChatSessions, db.mentorChatMessages]
        : [db.terms, db.progress];

    await db.transaction('rw', tablesToClear, async () => {
        // Clear existing data
        await Promise.all(tablesToClear.map(table => table.clear()));

        // Import data
        await db.terms.bulkAdd(data.terms);
        await db.progress.bulkAdd(data.progress);

        if (hasMentorData && data.mentorChatSessions && data.mentorChatMessages) {
            await db.mentorChatSessions.bulkAdd(data.mentorChatSessions);
            await db.mentorChatMessages.bulkAdd(data.mentorChatMessages);
        }
    });
}

export { db };
