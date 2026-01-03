/**
 * Centralized error handling system for NeuroLex
 * Provides custom error types and error logging service
 */

/**
 * Error codes for different types of errors in the application
 */
export enum ErrorCode {
    /** AI API related errors (401, 429, 500, etc.) */
    AI_API_ERROR = 'AI_API_ERROR',
    /** Database/IndexedDB operation errors */
    DATABASE_ERROR = 'DATABASE_ERROR',
    /** Input validation errors */
    VALIDATION_ERROR = 'VALIDATION_ERROR',
    /** Network connectivity issues */
    NETWORK_ERROR = 'NETWORK_ERROR',
    /** Authentication/authorization errors */
    AUTH_ERROR = 'AUTH_ERROR',
    /** Configuration errors */
    CONFIG_ERROR = 'CONFIG_ERROR',
    /** Unknown/unexpected errors */
    UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * Base application error class
 * Extends Error with additional properties for better error tracking
 */
export class AppError extends Error {
    /** Unique error code for categorization */
    public readonly code: ErrorCode;
    /** Additional details about the error (object, array, etc.) */
    public readonly details?: unknown;
    /** Timestamp when the error occurred */
    public readonly timestamp: number;
    /** Context where the error occurred (e.g., 'AI_PROXY', 'DATABASE') */
    public readonly context?: string;

    constructor(
        message: string,
        code: ErrorCode,
        details?: unknown,
        context?: string
    ) {
        super(message);
        this.name = 'AppError';
        this.code = code;
        this.details = details;
        this.timestamp = Date.now();
        this.context = context;

        // Maintains proper stack trace for where our error was thrown (only available on V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, AppError);
        }
    }

    /**
     * Converts error to a plain object for logging/serialization
     */
    toJSON() {
        return {
            name: this.name,
            message: this.message,
            code: this.code,
            details: this.details,
            timestamp: this.timestamp,
            context: this.context,
            stack: this.stack
        };
    }
}

/**
 * AI-related errors (API failures, timeout, etc.)
 */
export class AIError extends AppError {
    /** HTTP status code if available */
    public readonly statusCode?: number;
    /** The AI model that was being called */
    public readonly model?: string;

    constructor(
        message: string,
        statusCode?: number,
        details?: unknown,
        model?: string
    ) {
        super(message, ErrorCode.AI_API_ERROR, details, 'AI');
        this.name = 'AIError';
        this.statusCode = statusCode;
        this.model = model;
    }
}

/**
 * Database/IndexedDB operation errors
 */
export class DatabaseError extends AppError {
    /** The database operation that failed */
    public readonly operation?: string;
    /** The table/collection being accessed */
    public readonly table?: string;

    constructor(
        message: string,
        details?: unknown,
        operation?: string,
        table?: string
    ) {
        super(message, ErrorCode.DATABASE_ERROR, details, 'DATABASE');
        this.name = 'DatabaseError';
        this.operation = operation;
        this.table = table;
    }
}

/**
 * Input validation errors
 */
export class ValidationError extends AppError {
    /** The field that failed validation */
    public readonly field?: string;
    /** The invalid value that was provided */
    public readonly value?: unknown;

    constructor(
        message: string,
        field?: string,
        value?: unknown,
        details?: unknown
    ) {
        super(message, ErrorCode.VALIDATION_ERROR, details, 'VALIDATION');
        this.name = 'ValidationError';
        this.field = field;
        this.value = value;
    }
}

/**
 * Network connectivity errors
 */
export class NetworkError extends AppError {
    /** The URL that failed to load */
    public readonly url?: string;

    constructor(
        message: string,
        url?: string,
        details?: unknown
    ) {
        super(message, ErrorCode.NETWORK_ERROR, details, 'NETWORK');
        this.name = 'NetworkError';
        this.url = url;
    }
}

/**
 * Authentication/authorization errors
 */
export class AuthError extends AppError {
    constructor(
        message: string,
        details?: unknown
    ) {
        super(message, ErrorCode.AUTH_ERROR, details, 'AUTH');
        this.name = 'AuthError';
    }
}

/**
 * Configuration errors
 */
export class ConfigError extends AppError {
    /** The configuration key that is invalid */
    public readonly key?: string;

    constructor(
        message: string,
        key?: string,
        details?: unknown
    ) {
        super(message, ErrorCode.CONFIG_ERROR, details, 'CONFIG');
        this.name = 'ConfigError';
        this.key = key;
    }
}

/**
 * Error logger service for centralized error tracking
 * In production, this can be extended to send errors to external services
 */
export class ErrorLogger {
    private static instance: ErrorLogger;
    private isDevelopment = process.env.NODE_ENV === 'development';

    private constructor() {}

    /**
     * Get the singleton instance of ErrorLogger
     */
    static getInstance(): ErrorLogger {
        if (!ErrorLogger.instance) {
            ErrorLogger.instance = new ErrorLogger();
        }
        return ErrorLogger.instance;
    }

    /**
     * Log an error with optional context
     * @param error - The error to log
     * @param context - Additional context about where the error occurred
     */
    log(error: Error, context?: string): void {
        const logEntry = {
            timestamp: new Date().toISOString(),
            context: context || 'APP',
            ...(error instanceof AppError ? {
                name: error.name,
                message: error.message,
                code: error.code,
                details: error.details,
                stack: error.stack
            } : {
                name: error.name,
                message: error.message,
                stack: error.stack
            })
        };

        if (this.isDevelopment) {
            // In development, log to console with formatting
            console.error(`[${logEntry.context}]`, logEntry);
        } else {
            // In production, send to error tracking service
            // This can be extended to integrate with Sentry, LogRocket, etc.
            this.sendToErrorTracking(logEntry);
        }
    }

    /**
     * Log a warning (non-critical issue)
     */
    warn(message: string, context?: string, details?: unknown): void {
        const logEntry = {
            timestamp: new Date().toISOString(),
            context: context || 'APP',
            message,
            details
        };

        if (this.isDevelopment) {
            console.warn(`[${logEntry.context}]`, logEntry);
        }
    }

    /**
     * Log informational message
     */
    info(message: string, context?: string): void {
        if (this.isDevelopment) {
            console.log(`[${context || 'APP'}]`, message);
        }
    }

    /**
     * Send error to external tracking service (placeholder for production integration)
     * Can be extended to integrate with Sentry, LogRocket, etc.
     */
    private sendToErrorTracking(logEntry: Record<string, unknown>): void {
        // Placeholder for external error tracking integration
        // Examples:
        // - Sentry: Sentry.captureException(logEntry);
        // - LogRocket: logRocket.captureException(logEntry);
        // - Custom endpoint: fetch('/api/errors', { method: 'POST', body: JSON.stringify(logEntry) });

        // For now, just log to console in production as fallback
        console.error('[ErrorLogger]', logEntry);
    }
}

/**
 * Convenience function to log errors
 * @example
 * try {
 *   await someOperation();
 * } catch (error) {
 *   logError(error as Error, 'someOperation');
 * }
 */
export function logError(error: Error, context?: string): void {
    ErrorLogger.getInstance().log(error, context);
}

/**
 * Convenience function to log warnings
 */
export function logWarning(message: string, context?: string, details?: unknown): void {
    ErrorLogger.getInstance().warn(message, context, details);
}

/**
 * Convenience function to log info
 */
export function logInfo(message: string, context?: string): void {
    ErrorLogger.getInstance().info(message, context);
}

/**
 * Handle unknown errors and convert to AppError
 * @example
 * try {
 *   await riskyOperation();
 * } catch (error) {
 *   handleUnknownError(error);
 *   throw error; // re-throw if needed
 * }
 */
export function handleUnknownError(error: unknown): AppError {
    if (error instanceof AppError) {
        return error;
    }

    if (error instanceof Error) {
        return new AppError(error.message, ErrorCode.UNKNOWN_ERROR, error, 'UNKNOWN');
    }

    if (typeof error === 'string') {
        return new AppError(error, ErrorCode.UNKNOWN_ERROR, undefined, 'UNKNOWN');
    }

    return new AppError(
        'An unknown error occurred',
        ErrorCode.UNKNOWN_ERROR,
        error,
        'UNKNOWN'
    );
}

/**
 * Wrap an async function with error logging
 * @example
 * const safeFetch = withErrorLogging(fetch, 'fetchData');
 */
export function withErrorLogging<T extends (...args: unknown[]) => unknown>(
    fn: T,
    context?: string
): T {
    return ((...args: unknown[]) => {
        try {
            const result = fn(...args);
            if (result instanceof Promise) {
                return result.catch((error) => {
                    logError(error instanceof Error ? error : new Error(String(error)), context);
                    throw error;
                });
            }
            return result;
        } catch (error) {
            logError(error instanceof Error ? error : new Error(String(error)), context);
            throw error;
        }
    }) as T;
}
