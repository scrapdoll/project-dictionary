/**
 * Base AI Client
 * Provides shared functionality for all AI operations
 */

import { AIClientError, toAIClientError, parseErrorCode, AICode } from './errors';
import { logError } from '@/lib/errors';

/**
 * Configuration for AI client
 */
export interface AIConfig {
    /** API key for authentication */
    apiKey: string;
    /** Model identifier (e.g., 'gpt-4o', 'claude-3-opus') */
    model: string;
    /** Base URL for API requests */
    baseUrl: string;
    /** Request timeout in milliseconds */
    timeout?: number;
}

/**
 * Message format for LLM chat completion API
 */
export interface LLMMessage {
    /** Role: 'system', 'user', or 'assistant' */
    role: string;
    /** Message content */
    content: string;
}

/**
 * Tool definition for function calling
 */
export interface LLMTool {
    type: 'function';
    function: {
        name: string;
        description?: string;
        parameters?: Record<string, unknown>;
    };
}

/**
 * Tool call in LLM response
 */
export interface LLMToolCall {
    id: string;
    type: string;
    function: {
        name: string;
        arguments: string;
    };
}

/**
 * Response from LLM chat completion API
 */
export interface LLMResponse {
    /** Text content of the response */
    content?: string;
    /** Tool calls requested by the model */
    toolCalls?: LLMToolCall[];
    /** Raw response data */
    raw?: unknown;
}

/**
 * Options for AI requests
 */
export interface AIRequestOptions {
    /** Tools to enable for function calling */
    tools?: LLMTool[];
    /** Tool choice mode ('auto', 'required', or specific function) */
    toolChoice?: 'auto' | 'required' | { type: 'function'; function: { name: string } };
    /** Custom temperature (0.0 - 2.0) */
    temperature?: number;
    /** Maximum tokens in response */
    maxTokens?: number;
    /** Request timeout override */
    timeout?: number;
}

/**
 * Base AI Client class
 * Handles all common AI API interactions
 */
export class AIClient {
    protected config: AIConfig;
    protected defaultTimeout: number;

    constructor(config: AIConfig) {
        this.config = config;
        this.defaultTimeout = config.timeout || 30000;
    }

    /**
     * Make a chat completion request to the LLM API
     *
     * @param messages - Array of conversation messages
     * @param options - Additional request options
     * @returns LLM response with content and/or tool calls
     *
     * @throws AIClientError on API errors
     */
    protected async callLLM(
        messages: LLMMessage[],
        options: AIRequestOptions = {}
    ): Promise<LLMResponse> {
        const {
            tools,
            toolChoice,
            temperature = 0.7,
            maxTokens,
            timeout = this.defaultTimeout
        } = options;

        // Clean up base URL
        const cleanBaseUrl = this.config.baseUrl.replace(/['"]/g, '').replace(/\/$/, '');
        const url = `${cleanBaseUrl}/chat/completions`;

        const requestBody: Record<string, unknown> = {
            model: this.config.model,
            messages,
            temperature
        };

        // Add optional parameters
        if (tools && tools.length > 0) {
            requestBody.tools = tools;
            requestBody.tool_choice = toolChoice || 'auto';
        }

        if (maxTokens) {
            requestBody.max_tokens = maxTokens;
        }

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);

            const response = await fetch('/api/ai-proxy', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    messages,
                    apiKey: this.config.apiKey,
                    model: this.config.model,
                    baseUrl: this.config.baseUrl,
                    tools,
                    toolChoice: toolChoice || (tools && tools.length > 0 ? 'auto' : undefined)
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const error = await AIClientError.fromResponse(response, this.config.model, url);
                logError(error, 'AI_PROXY');
                throw error;
            }

            const data = await response.json();
            const message = data.choices?.[0]?.message;

            if (!message) {
                throw new AIClientError(
                    'Invalid response format from API',
                    parseErrorCode(data),
                    undefined,
                    data,
                    this.config.model,
                    url
                );
            }

            return {
                content: message.content,
                toolCalls: message.tool_calls,
                raw: data
            };

        } catch (error) {
            // Handle timeout
            if (error instanceof Error && error.name === 'AbortError') {
                throw new AIClientError(
                    'Request timeout',
                    AICode.TIMEOUT,
                    undefined,
                    undefined,
                    this.config.model,
                    url
                );
            }

            // Re-throw AIClientError as-is
            if (error instanceof AIClientError) {
                throw error;
            }

            // Wrap other errors
            throw toAIClientError(error, this.config.model, url);
        }
    }

    /**
     * Parse JSON content from LLM response
     * Handles markdown code blocks and extracts JSON
     *
     * @param content - Raw content string
     * @returns Parsed JSON object
     * @throws AIClientError if parsing fails
     */
    protected parseJSONResponse<T = unknown>(content: string): T {
        // Remove markdown code blocks if present
        let clean = content.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();

        try {
            return JSON.parse(clean) as T;
        } catch (parseError) {
            // Try to extract JSON from the content
            const jsonMatch = clean.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                try {
                    return JSON.parse(jsonMatch[0]) as T;
                } catch {
                    // Second parse attempt failed
                }
            }

            throw new AIClientError(
                'Failed to parse JSON response',
                AICode.PARSE_ERROR,
                undefined,
                { content, parseError },
                this.config.model
            );
        }
    }

    /**
     * Update client configuration
     */
    updateConfig(config: Partial<AIConfig>): void {
        this.config = { ...this.config, ...config };
    }

    /**
     * Get current configuration
     */
    getConfig(): AIConfig {
        return { ...this.config };
    }
}

/**
 * Factory function to create an AI client
 *
 * @param config - AI configuration
 * @returns Configured AIClient instance
 *
 * @example
 * ```ts
 * const client = createAIClient({
 *   apiKey: 'sk-...',
 *   model: 'gpt-4o',
 *   baseUrl: 'https://api.openai.com/v1'
 * });
 * ```
 */
export function createAIClient(config: AIConfig): AIClient {
    return new AIClient(config);
}
