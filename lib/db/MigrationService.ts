/**
 * Migration Service
 *
 * Manages database migrations with backup, restore, and rollback capabilities.
 * Ensures data integrity during schema changes.
 *
 * @example
 * ```ts
 * const migrationService = new MigrationService(db);
 * await migrationService.migrate();
 * ```
 */

import Dexie from 'dexie';
import {
    MIGRATIONS,
    getLatestMigrationVersion,
    getPendingMigrations,
    createBackup,
    restoreFromBackup,
    saveMigrationRecord,
    getMigrationHistory,
    type Migration,
    type Transaction
} from './migrations';
import { logError } from '@/lib/errors';
import type { DatabaseExport } from '../db';

export interface MigrationOptions {
    /** Whether to create a backup before migrating */
    createBackup?: boolean;
    /** Callback for progress updates */
    onProgress?: (current: number, total: number, migration: Migration) => void;
    /** Callback for completion */
    onComplete?: () => void;
    /** Callback for errors */
    onError?: (error: Error, migration: Migration) => void;
}

export interface MigrationResult {
    success: boolean;
    fromVersion: number;
    toVersion: number;
    migrationsApplied: number;
    backup?: DatabaseExport;
    error?: Error;
}

/**
 * Service for managing database migrations
 */
export class MigrationService {
    private db: Dexie;
    private latestVersion: number;

    constructor(db: Dexie) {
        this.db = db;
        this.latestVersion = getLatestMigrationVersion();
    }

    /**
     * Run all pending migrations
     *
     * @param options - Migration options
     * @returns Migration result
     */
    async migrate(options: MigrationOptions = {}): Promise<MigrationResult> {
        const {
            createBackup: shouldCreateBackup = true,
            onProgress,
            onComplete,
            onError
        } = options;

        const currentVersion = this.db.verno;
        const pendingMigrations = getPendingMigrations(currentVersion);

        // Check if migrations are needed
        if (pendingMigrations.length === 0) {
            return {
                success: true,
                fromVersion: currentVersion,
                toVersion: currentVersion,
                migrationsApplied: 0
            };
        }

        let backup: DatabaseExport | undefined;

        try {
            // Create backup if requested
            if (shouldCreateBackup) {
                backup = await createBackup(this.db);
                console.log('[MigrationService] Backup created');
            }

            // Apply each pending migration
            for (let i = 0; i < pendingMigrations.length; i++) {
                const migration = pendingMigrations[i];
                const targetVersion = migration.version;

                // Notify progress
                onProgress?.(i + 1, pendingMigrations.length, migration);
                console.log(`[MigrationService] Applying v${migration.version}: ${migration.name}`);

                // Apply migration
                await this.applyMigration(migration);

                // Record successful migration
                saveMigrationRecord({
                    version: migration.version,
                    name: migration.name,
                    appliedAt: Date.now(),
                    success: true
                });

                // Reopen database to update schema
                if (targetVersion > this.db.verno) {
                    await this.db.open();
                }
            }

            const result: MigrationResult = {
                success: true,
                fromVersion: currentVersion,
                toVersion: this.latestVersion,
                migrationsApplied: pendingMigrations.length,
                backup
            };

            onComplete?.();
            console.log(`[MigrationService] Successfully migrated from v${currentVersion} to v${this.latestVersion}`);

            return result;

        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            logError(err, 'MigrationService.migrate');

            // Attempt rollback
            if (backup) {
                console.error('[MigrationService] Migration failed, attempting rollback...');
                try {
                    await restoreFromBackup(this.db, backup);
                    console.log('[MigrationService] Rollback successful');
                } catch (rollbackError) {
                    logError(rollbackError instanceof Error ? rollbackError : new Error(String(rollbackError)), 'MigrationService.rollback');
                    console.error('[MigrationService] Rollback failed - backup stored but could not restore');
                }
            }

            onError?.(err, pendingMigrations[pendingMigrations.length - 1]);

            return {
                success: false,
                fromVersion: currentVersion,
                toVersion: currentVersion,
                migrationsApplied: 0,
                backup,
                error: err
            };
        }
    }

    /**
     * Apply a single migration
     *
     * @param migration - Migration to apply
     */
    private async applyMigration(migration: Migration): Promise<void> {
        try {
            // Create a transaction wrapper
            const tx: Transaction = {
                db: this.db,
                table: (name: string) => {
                    if (!(name in this.db)) {
                        throw new Error(`Table ${name} does not exist`);
                    }
                    return (this.db as any)[name];
                }
            };

            await migration.up(tx);
        } catch (error) {
            // Record failed migration
            saveMigrationRecord({
                version: migration.version,
                name: migration.name,
                appliedAt: Date.now(),
                success: false,
                error: error instanceof Error ? error.message : String(error)
            });

            throw error;
        }
    }

    /**
     * Rollback a specific migration
     *
     * @param version - Version to rollback to
     */
    async rollback(version: number): Promise<void> {
        const migration = getPendingMigrations(version).find(m => m.version === version);

        if (!migration) {
            throw new Error(`Migration version ${version} not found`);
        }

        if (!migration.down) {
            throw new Error(`Migration ${migration.name} does not support rollback`);
        }

        // Create backup before rollback
        const backup = await createBackup(this.db);

        try {
            const tx: Transaction = {
                db: this.db,
                table: (name: string) => {
                    if (!(name in this.db)) {
                        throw new Error(`Table ${name} does not exist`);
                    }
                    return (this.db as any)[name];
                }
            };

            await migration.down(tx);

            // Record rollback
            saveMigrationRecord({
                version: migration.version,
                name: `${migration.name} (rollback)`,
                appliedAt: Date.now(),
                success: true
            });

            console.log(`[MigrationService] Rolled back v${version}: ${migration.name}`);

        } catch (error) {
            // Restore backup on failure
            await restoreFromBackup(this.db, backup);
            throw error;
        }
    }

    /**
     * Get migration status
     */
    getStatus(): {
        currentVersion: number;
        latestVersion: number;
        pendingMigrations: Migration[];
        history: ReturnType<typeof getMigrationHistory>;
    } {
        return {
            currentVersion: this.db.verno,
            latestVersion: this.latestVersion,
            pendingMigrations: getPendingMigrations(this.db.verno),
            history: getMigrationHistory()
        };
    }

    /**
     * Force a specific version (for testing/debugging)
     * WARNING: This can cause data loss
     */
    async forceVersion(version: number): Promise<void> {
        console.warn(`[MigrationService] Forcing version to ${version}. This may cause data loss.`);
        await this.db.close();
        await this.db.open().then(() => {
            // Version changes are handled by Dexie
        });
    }
}

/**
 * Create a migration service instance
 * @param db - Dexie database instance
 * @returns Configured MigrationService instance
 */
export function createMigrationService(db: Dexie): MigrationService {
    return new MigrationService(db);
}
