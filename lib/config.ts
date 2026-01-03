/**
 * Centralized configuration management for NeuroLex
 * Provides type-safe configuration with localStorage persistence
 */

/**
 * XP (experience points) configuration
 * Controls how users earn XP through study activities
 */
export interface XPConfig {
    /** Base XP earned for reviewing a term */
    base: number;
    /** Additional XP per grade point (0-5) */
    perGrade: number;
    /** Bonus XP for completing AI-generated quizzes */
    quizBonus: number;
    /** Bonus XP for adding new terms */
    addTermBonus: number;
    /** Bonus XP for completing mentor chat session */
    mentorSessionBonus: number;
}

/**
 * AI model configuration
 * Controls behavior of AI-powered features
 */
export interface AIConfig {
    /** Default OpenAI-compatible model to use */
    defaultModel: string;
    /** Default base URL for API requests */
    defaultBaseUrl: string;
    /** Default language for responses (BCP 47 language tag) */
    defaultLanguage: string;
    /** Maximum tokens for AI responses */
    maxTokens: number;
    /** Temperature for AI responses (0.0 - 2.0) */
    temperature: number;
    /** Timeout for API requests in milliseconds */
    timeout: number;
}

/**
 * Spaced Repetition System (SRS) configuration
 * Controls the SM-2 algorithm parameters
 */
export interface SRSConfig {
    /** Default easiness factor (2.5 is standard) */
    defaultEFactor: number;
    /** Minimum interval between reviews (days) */
    minInterval: number;
    /** Maximum interval between reviews (days) */
    maxInterval: number;
    /** Time of day when reviews become due (4:00 AM default) */
    reviewHour: number;
}

/**
 * UI/UX configuration
 * Controls user interface behavior and preferences
 */
export interface UIConfig {
    /** Number of items per study session */
    itemsPerSession: number;
    /** Auto-play audio for pronunciation */
    autoPlayAudio: boolean;
    /** Show progress indicators */
    showProgress: boolean;
    /** Enable keyboard shortcuts */
    keyboardShortcuts: boolean;
    /** Animation speed multiplier (1.0 = normal) */
    animationSpeed: number;
    /** Theme preference */
    theme: 'light' | 'dark' | 'auto';
}

/**
 * Mentor configuration
 * Controls AI mentor behavior
 */
export interface MentorConfig {
    /** Maximum messages per session */
    maxMessages: number;
    /** Whether to suggest adding terms automatically */
    autoSuggestTerms: boolean;
    /** Quiz difficulty ('beginner' | 'intermediate' | 'advanced') */
    defaultLevel: 'beginner' | 'intermediate' | 'advanced';
    /** Whether to use Socratic method by default */
    socraticMode: boolean;
}

/**
 * Complete application configuration
 */
export interface AppConfig {
    /** XP and rewards settings */
    xp: XPConfig;
    /** AI model settings */
    ai: AIConfig;
    /** Spaced repetition settings */
    srs: SRSConfig;
    /** User interface settings */
    ui: UIConfig;
    /** AI mentor settings */
    mentor: MentorConfig;
}

/**
 * Default configuration values
 * Used as fallback when no custom config is stored
 */
export const DEFAULT_CONFIG: AppConfig = {
    xp: {
        base: 10,
        perGrade: 2,
        quizBonus: 5,
        addTermBonus: 15,
        mentorSessionBonus: 20
    },
    ai: {
        defaultModel: 'gpt-4o',
        defaultBaseUrl: 'https://api.openai.com/v1',
        defaultLanguage: 'en-US',
        maxTokens: 1000,
        temperature: 0.7,
        timeout: 30000
    },
    srs: {
        defaultEFactor: 2.5,
        minInterval: 1,
        maxInterval: 365,
        reviewHour: 4
    },
    ui: {
        itemsPerSession: 10,
        autoPlayAudio: false,
        showProgress: true,
        keyboardShortcuts: true,
        animationSpeed: 1.0,
        theme: 'auto'
    },
    mentor: {
        maxMessages: 50,
        autoSuggestTerms: true,
        defaultLevel: 'beginner',
        socraticMode: true
    }
};

/** LocalStorage key for persisting configuration */
export const CONFIG_STORAGE_KEY = 'neurolex_config';

/**
 * Get the current application configuration
 * Merges stored user preferences with defaults
 *
 * @example
 * ```ts
 * const config = getConfig();
 * console.log(config.ai.defaultModel); // 'gpt-4o' or user's preference
 * ```
 */
export function getConfig(): AppConfig {
    if (typeof window === 'undefined') {
        // Server-side: return defaults
        return DEFAULT_CONFIG;
    }

    try {
        const stored = localStorage.getItem(CONFIG_STORAGE_KEY);
        if (!stored) {
            return DEFAULT_CONFIG;
        }

        const parsed = JSON.parse(stored);
        // Deep merge with defaults to handle new config keys
        return deepMerge(DEFAULT_CONFIG, parsed);
    } catch (error) {
        // If localStorage is corrupted, return defaults
        console.warn('Failed to load config, using defaults:', error);
        return DEFAULT_CONFIG;
    }
}

/**
 * Update configuration with new values
 * Only updates the specified keys, preserves others
 *
 * @param updates - Partial config object with values to update
 *
 * @example
 * ```ts
 * // Update single value
 * updateConfig({ ai: { defaultModel: 'gpt-4' } });
 *
 * // Update multiple values
 * updateConfig({
 *   xp: { base: 15 },
 *   ui: { itemsPerSession: 20 }
 * });
 * ```
 */
export function updateConfig(updates: Partial<AppConfig>): void {
    if (typeof window === 'undefined') {
        return;
    }

    const current = getConfig();
    const updated = deepMerge(current, updates);

    try {
        localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
        console.error('Failed to save config:', error);
    }
}

/**
 * Reset configuration to defaults
 * Clears all user preferences
 */
export function resetConfig(): void {
    if (typeof window === 'undefined') {
        return;
    }

    try {
        localStorage.removeItem(CONFIG_STORAGE_KEY);
    } catch (error) {
        console.error('Failed to reset config:', error);
    }
}

/**
 * Export configuration to JSON
 * Useful for backup/restore functionality
 */
export function exportConfig(): string {
    const config = getConfig();
    return JSON.stringify(config, null, 2);
}

/**
 * Import configuration from JSON
 * Validates and applies imported configuration
 *
 * @param jsonString - JSON string to import
 * @returns true if import was successful
 */
export function importConfig(jsonString: string): boolean {
    try {
        const parsed = JSON.parse(jsonString);
        // Validate structure (basic check)
        if (!parsed || typeof parsed !== 'object') {
            throw new Error('Invalid config format');
        }

        updateConfig(parsed);
        return true;
    } catch (error) {
        console.error('Failed to import config:', error);
        return false;
    }
}

/**
 * Deep merge two objects
 * Creates a new object with values from both sources
 * Values from `source` take precedence over `target`
 */
function deepMerge<T>(target: T, source: Partial<T>): T {
    const output = { ...target };

    for (const key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
            const sourceValue = source[key];
            const targetValue = output[key as keyof T];

            if (sourceValue && typeof sourceValue === 'object' && !Array.isArray(sourceValue) &&
                targetValue && typeof targetValue === 'object' && !Array.isArray(targetValue)) {
                // Recursively merge nested objects
                (output as Record<string, unknown>)[key] = deepMerge(
                    targetValue as Record<string, unknown>,
                    sourceValue as Record<string, unknown>
                );
            } else {
                // Override with source value
                (output as Record<string, unknown>)[key] = sourceValue;
            }
        }
    }

    return output;
}

/**
 * NOTE: The React hook useConfig is implemented separately in hooks/useConfig.ts
 * to maintain proper separation between utility functions and React hooks.
 */
