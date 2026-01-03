/**
 * Database Module
 *
 * Centralized exports for database-related functionality
 */

export { db, exportDatabase, importDatabase, type DatabaseExport } from '../db';
export {
    MigrationService,
    createMigrationService,
    type MigrationOptions,
    type MigrationResult
} from './MigrationService';
export {
    MIGRATIONS,
    getLatestMigrationVersion,
    getMigrationByVersion,
    getPendingMigrations,
    saveMigrationRecord,
    getMigrationHistory,
    clearMigrationHistory,
    createBackup,
    restoreFromBackup,
    type Migration,
    type MigrationRecord,
    type Transaction
} from './migrations';
