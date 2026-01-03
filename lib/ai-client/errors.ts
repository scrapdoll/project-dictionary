/**
 * AI Client error types
 * Specialized error handling for AI API interactions
 */

import { AIError, ErrorCode } from '@/lib/errors';

/**
 * Specific AI error codes for more granular error handling
 */
export enum AICode {
    /** API key is missing or invalid */
    INVALID_API_KEY = 'INVALID_API_KEY',
    /** API rate limit exceeded */
    RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
    /** Request timeout */
    TIMEOUT = 'TIMEOUT',
    /** Invalid request format or parameters */
    INVALID_REQUEST = 'INVALID_REQUEST',
    /** Model not found or unavailable */
    MODEL_NOT_FOUND = 'MODEL_NOT_FOUND',
    /** Insufficient quota/tokens */
    INSUFFICIENT_QUOTA = 'INSUFFICIENT_QUOTA',
    /** Content filter blocked the request */
    CONTENT_FILTERED = 'CONTENT_FILTERED',
    /** Response parsing failed */
    PARSE_ERROR = 'PARSE_ERROR',
    /** Network connectivity issue */
    NETWORK_ERROR = 'NETWORK_ERROR'
}

/**
 * Maps HTTP status codes to AI error codes
 */
const STATUS_CODE_MAP: Record<number, AICode> = {
    400: AICode.INVALID_REQUEST,
    401: AICode.INVALID_API_KEY,
    403: AICode.CONTENT_FILTERED,
    404: AICode.MODEL_NOT_FOUND,
    429: AICode.RATE_LIMIT_EXCEEDED,
    500: AICode.NETWORK_ERROR,
    502: AICode.NETWORK_ERROR,
    503: AICode.NETWORK_ERROR,
    504: AICode.TIMEOUT
};

/**
 * AI client specific error class
 * Extends the base AIError with additional context for AI operations
 */
export class AIClientError extends AIError {
    /** Specific AI error code */
    public readonly aiCode: AICode;
    /** The model that was being called when error occurred */
    public readonly model?: string;
    /** The API endpoint that was called */
    public readonly endpoint?: string;
    /** Request ID for tracing (if available from API) */
    public readonly requestId?: string;

    constructor(
        message: string,
        aiCode: AICode,
        statusCode?: number,
        details?: unknown,
        model?: string,
        endpoint?: string,
        requestId?: string
    ) {
        super(message, statusCode, details, model);
        this.name = 'AIClientError';
        // code is already set by AIError constructor to ErrorCode.AI_API_ERROR
        this.aiCode = aiCode;
        this.model = model;
        this.endpoint = endpoint;
        this.requestId = requestId;
    }

    /**
     * Create an AIClientError from a fetch Response object
     */
    static async fromResponse(response: Response, model?: string, endpoint?: string): Promise<AIClientError> {
        const statusCode = response.status;
        const aiCode = STATUS_CODE_MAP[statusCode] || AICode.NETWORK_ERROR;

        let details: unknown;
        let message = response.statusText;

        try {
            const json = await response.json();
            details = json;
            // Try to extract a more descriptive error message
            message = (json.error?.message || json.error || json.message || response.statusText) as string;
        } catch {
            // Not JSON, use status text
            message = response.statusText;
        }

        return new AIClientError(
            message,
            aiCode,
            statusCode,
            details,
            model,
            endpoint,
            // Some APIs return a request ID in headers
            response.headers.get('x-request-id') || undefined
        );
    }

    /**
     * Check if this is a recoverable error (can retry)
     */
    isRecoverable(): boolean {
        return [
            AICode.RATE_LIMIT_EXCEEDED,
            AICode.TIMEOUT,
            AICode.NETWORK_ERROR
        ].includes(this.aiCode);
    }

    /**
     * Check if this error is due to invalid credentials
     */
    isAuthError(): boolean {
        return this.aiCode === AICode.INVALID_API_KEY;
    }

    /**
     * Get a user-friendly error message
     */
    getUserMessage(): string {
        switch (this.aiCode) {
            case AICode.INVALID_API_KEY:
                return 'Please check your API key in settings.';
            case AICode.RATE_LIMIT_EXCEEDED:
                return 'Too many requests. Please wait a moment and try again.';
            case AICode.TIMEOUT:
                return 'The request timed out. Please try again.';
            case AICode.MODEL_NOT_FOUND:
                return `The model "${this.model}" is not available. Please check your settings.`;
            case AICode.INSUFFICIENT_QUOTA:
                return 'You have exceeded your API quota. Please check your account.';
            case AICode.CONTENT_FILTERED:
                return 'This content was blocked by the content filter.';
            case AICode.PARSE_ERROR:
                return 'Failed to process the AI response. Please try again.';
            case AICode.NETWORK_ERROR:
                return 'Network error. Please check your connection and try again.';
            default:
                return 'An unexpected error occurred. Please try again.';
        }
    }
}

/**
 * Create an AIClientError from a generic Error
 */
export function toAIClientError(error: unknown, model?: string, endpoint?: string): AIClientError {
    if (error instanceof AIClientError) {
        return error;
    }

    if (error instanceof AIError) {
        return new AIClientError(
            error.message,
            AICode.NETWORK_ERROR,
            error.statusCode,
            error.details,
            model || error.model,
            endpoint
        );
    }

    if (error instanceof Error) {
        return new AIClientError(
            error.message,
            AICode.NETWORK_ERROR,
            undefined,
            error,
            model,
            endpoint
        );
    }

    return new AIClientError(
        'An unknown error occurred',
        AICode.NETWORK_ERROR,
        undefined,
        error,
        model,
        endpoint
    );
}

/**
 * Parse error code from API response details
 */
export function parseErrorCode(details: unknown): AICode {
    if (!details || typeof details !== 'object') {
        return AICode.NETWORK_ERROR;
    }

    const detailsObj = details as Record<string, unknown>;
    const errorInfo = detailsObj.error as { code?: string } | undefined;
    const errorCode = errorInfo?.code || detailsObj.code as string | undefined;

    if (typeof errorCode === 'string') {
        const upperCode = errorCode.toUpperCase();

        if (upperCode.includes('RATE') || upperCode.includes('LIMIT')) {
            return AICode.RATE_LIMIT_EXCEEDED;
        }
        if (upperCode.includes('KEY') || upperCode.includes('AUTH')) {
            return AICode.INVALID_API_KEY;
        }
        if (upperCode.includes('TIMEOUT')) {
            return AICode.TIMEOUT;
        }
        if (upperCode.includes('MODEL')) {
            return AICode.MODEL_NOT_FOUND;
        }
        if (upperCode.includes('QUOTA') || upperCode.includes('BILLING')) {
            return AICode.INSUFFICIENT_QUOTA;
        }
        if (upperCode.includes('FILTER') || upperCode.includes('CONTENT')) {
            return AICode.CONTENT_FILTERED;
        }
    }

    return AICode.INVALID_REQUEST;
}
