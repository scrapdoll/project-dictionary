/**
 * Database Migrations
 *
 * Defines schema migrations for IndexedDB database.
 * Each migration has a version number, description, and up/down functions.
 */

import { Dexie } from 'dexie';
import type { DatabaseExport } from '../db';

/**
 * Represents a single database migration
 */
export interface Migration {
    /** Version number for this migration */
    version: number;
    /** Human-readable name for the migration */
    name: string;
    /** Description of what this migration does */
    description: string;
    /** Function to apply the migration */
    up: (tx: Transaction) => Promise<void>;
    /** Function to rollback the migration (optional) */
    down?: (tx: Transaction) => Promise<void>;
}

/**
 * Transaction type for migrations
 */
export interface Transaction {
    db: Dexie;
    table: (name: string) => Dexie.Table<any, any>;
}

/**
 * Migration history tracking
 */
export interface MigrationRecord {
    version: number;
    name: string;
    appliedAt: number;
    success: boolean;
    error?: string;
}

/**
 * All database migrations
 * Add new migrations to this array
 */
export const MIGRATIONS: Migration[] = [
    {
        version: 1,
        name: 'initial_schema',
        description: 'Initial database schema with terms, progress, and settings tables',
        up: async (tx) => {
            // This is handled by Dexie's version declaration
            await Promise.resolve();
        }
    },
    {
        version: 2,
        name: 'add_xp_to_settings',
        description: 'Add XP field to settings for gamification',
        up: async (tx) => {
            const settings = tx.table('settings');
            await settings.toCollection().modify((setting: any) => {
                if (typeof setting.xp !== 'number') {
                    setting.xp = 0;
                }
            });
        },
        down: async (tx) => {
            const settings = tx.table('settings');
            await settings.toCollection().modify((setting: any) => {
                delete setting.xp;
            });
        }
    },
    {
        version: 3,
        name: 'add_mentor_tables',
        description: 'Add mentor chat sessions and messages tables',
        up: async (tx) => {
            // Tables are created by Dexie, but we can initialize indexes
            await Promise.resolve();
        }
    }
];

/**
 * Get the latest migration version
 */
export function getLatestMigrationVersion(): number {
    if (MIGRATIONS.length === 0) return 0;
    return Math.max(...MIGRATIONS.map(m => m.version));
}

/**
 * Get migration by version
 */
export function getMigrationByVersion(version: number): Migration | undefined {
    return MIGRATIONS.find(m => m.version === version);
}

/**
 * Get all pending migrations
 */
export function getPendingMigrations(currentVersion: number): Migration[] {
    return MIGRATIONS.filter(m => m.version > currentVersion);
}

/**
 * Migration history storage key
 */
const MIGRATION_HISTORY_KEY = 'neurolex_migration_history';

/**
 * Save migration record to localStorage
 */
export function saveMigrationRecord(record: MigrationRecord): void {
    try {
        const history = getMigrationHistory();
        history.push(record);
        localStorage.setItem(MIGRATION_HISTORY_KEY, JSON.stringify(history));
    } catch (error) {
        console.error('Failed to save migration record:', error);
    }
}

/**
 * Get migration history from localStorage
 */
export function getMigrationHistory(): MigrationRecord[] {
    try {
        const data = localStorage.getItem(MIGRATION_HISTORY_KEY);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
}

/**
 * Clear migration history (useful for testing)
 */
export function clearMigrationHistory(): void {
    localStorage.removeItem(MIGRATION_HISTORY_KEY);
}

/**
 * Export backup of current database state
 * @param db - Dexie database instance
 * @returns Backup data
 */
export async function createBackup(db: Dexie): Promise<DatabaseExport> {
    const tables = ['terms', 'progress', 'settings', 'mentorChatSessions', 'mentorChatMessages'] as const;

    const data: Record<string, any[]> = {};
    for (const tableName of tables) {
        const table = (db as any)[tableName];
        if (table) {
            data[tableName] = await table.toArray();
        }
    }

    return {
        terms: data.terms || [],
        progress: data.progress || [],
        mentorChatSessions: data.mentorChatSessions || [],
        mentorChatMessages: data.mentorChatMessages || [],
        exportedAt: Date.now(),
        version: db.verno
    };
}

/**
 * Restore database from backup
 * @param db - Dexie database instance
 * @param backup - Backup data to restore
 */
export async function restoreFromBackup(db: Dexie, backup: DatabaseExport): Promise<void> {
    const hasMentorData = backup.mentorChatSessions && backup.mentorChatMessages;
    const tables = hasMentorData
        ? [(db as any).terms, (db as any).progress, (db as any).mentorChatSessions, (db as any).mentorChatMessages]
        : [(db as any).terms, (db as any).progress];

    await db.transaction('rw', tables, async () => {
        // Clear existing data
        await Promise.all(tables.map(table => table.clear()));

        // Restore data
        await (db as any).terms.bulkAdd(backup.terms);
        await (db as any).progress.bulkAdd(backup.progress);

        if (hasMentorData) {
            await (db as any).mentorChatSessions.bulkAdd(backup.mentorChatSessions!);
            await (db as any).mentorChatMessages.bulkAdd(backup.mentorChatMessages!);
        }
    });
}
