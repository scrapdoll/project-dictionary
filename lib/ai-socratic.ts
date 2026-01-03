/**
 * Socratic Mentor AI Integration
 * Provides Socratic method teaching through questioning rather than direct answers
 * Refactored to use SocraticAIClient
 */

import { MentorQuiz, MentorChatMessage, SocraticMentorResponse, MentorToolAction } from './types';
import { createSocraticClient, SocraticAIClient } from './ai-client';
import { logError } from '@/lib/errors';

/**
 * Client cache for SocraticAIClient instances
 */
let cachedClient: SocraticAIClient | null = null;
let lastConfig: { apiKey: string; model: string; baseUrl: string } | null = null;

/**
 * Get or create a cached SocraticAIClient instance
 */
function getClient(
    apiKey: string,
    model: string,
    baseUrl: string
): SocraticAIClient {
    // Check if we can reuse the cached client
    if (cachedClient && lastConfig) {
        if (
            lastConfig.apiKey === apiKey &&
            lastConfig.model === model &&
            lastConfig.baseUrl === baseUrl
        ) {
            return cachedClient;
        }
    }

    // Create new client
    const client = createSocraticClient({ apiKey, model, baseUrl });
    cachedClient = client;
    lastConfig = { apiKey, model, baseUrl };
    return client;
}

/**
 * Get a Socratic mentor response for a user message
 *
 * @param topic - The learning topic
 * @param userMessage - The user's current message
 * @param conversationHistory - Previous messages in the conversation
 * @param apiKey - OpenAI-compatible API key
 * @param model - Model identifier (e.g., 'gpt-4o')
 * @param baseUrl - Base URL for API requests
 * @param language - Response language (BCP 47 tag, default 'en-US')
 * @param existingTerms - Terms already in the user's dictionary
 * @returns Socratic mentor response with optional tool actions and quizzes
 *
 * @example
 * ```ts
 * const response = await socraticMentorResponse(
 *   'Machine Learning',
 *   'What is a neural network?',
 *   history,
 *   apiKey,
 *   'gpt-4o',
 *   'https://api.openai.com/v1',
 *   'en-US',
 *   ['epoch', 'batch']
 * );
 * ```
 */
export async function socraticMentorResponse(
    topic: string,
    userMessage: string,
    conversationHistory: MentorChatMessage[],
    apiKey: string,
    model: string,
    baseUrl: string,
    language: string = 'en-US',
    existingTerms: string[] = []
): Promise<SocraticMentorResponse> {
    try {
        const client = getClient(apiKey, model, baseUrl);
        return await client.getResponse(
            topic,
            userMessage,
            conversationHistory,
            language,
            existingTerms
        );
    } catch (error) {
        logError(error instanceof Error ? error : new Error(String(error)), 'socraticMentorResponse');

        // Fallback response on error
        return {
            message: language.startsWith('ru')
                ? 'Давай подумаем об этом вместе. Что ты уже знаешь об этой теме?'
                : "Let's think about this together. What do you already know about this topic?",
            socraticQuestion: language.startsWith('ru')
                ? 'С чего бы ты хотел начать?'
                : "Where would you like to start?",
            shouldCreateQuiz: false
        };
    }
}

/**
 * Evaluate a user's answer to a Socratic mentor quiz
 *
 * @param quiz - The quiz that was answered
 * @param userAnswer - The user's response
 * @param apiKey - OpenAI-compatible API key
 * @param model - Model identifier
 * @param baseUrl - Base URL for API requests
 * @param language - Feedback language (default 'en-US')
 * @returns Quiz evaluation with grade, feedback, and correct answer
 *
 * @example
 * ```ts
 * const evaluation = await evaluateSocraticQuiz(
 *   quiz,
 *   'A neural network is a series of algorithms...',
 *   apiKey,
 *   'gpt-4o',
 *   'https://api.openai.com/v1'
 * );
 * ```
 */
export async function evaluateSocraticQuiz(
    quiz: MentorQuiz,
    userAnswer: string,
    apiKey: string,
    model: string,
    baseUrl: string,
    language: string = 'en-US'
): Promise<MentorQuiz['evaluation']> {
    try {
        const client = getClient(apiKey, model, baseUrl);
        return await client.evaluateQuizAnswer(quiz, userAnswer, language);
    } catch (error) {
        logError(error instanceof Error ? error : new Error(String(error)), 'evaluateSocraticQuiz');
        throw error;
    }
}

/**
 * Extract term suggestions from a conversation
 *
 * @param conversationHistory - Previous messages in the conversation
 * @param existingTerms - Terms already in the user's dictionary
 * @returns Array of suggested terms with definitions and context
 *
 * @example
 * ```ts
 * const suggestions = extractTermSuggestions(
 *   messages,
 *   ['neural', 'epoch']
 * );
 * // Returns terms mentioned in conversation that aren't already in dictionary
 * ```
 */
export function extractTermSuggestions(
    conversationHistory: MentorChatMessage[],
    existingTerms: string[] = []
): Array<{ term: string; definition: string; context: string }> {
    const suggestions: Array<{ term: string; definition: string; context: string }> = [];
    const existingTermsLower = new Set(existingTerms.map(t => t.toLowerCase()));

    // Look for patterns where concepts are explained
    conversationHistory.forEach(msg => {
        if (!msg.content || msg.role !== 'assistant') return;

        // Look for definitions: "X is Y", "X means Y", etc.
        const definitionPatterns = [
            /(\w+(?:\s+\w+)?)\s+is\s+([^.]+)\./gi,
            /(\w+(?:\s+\w+)?)\s+means\s+([^.]+)\./gi,
            /(\w+(?:\s+\w+)?)\s+refers to\s+([^.]+)\./gi
        ];

        definitionPatterns.forEach(pattern => {
            const matches = [...msg.content.matchAll(pattern)];
            matches.forEach(match => {
                const term = match[1]?.trim();
                const definition = match[2]?.trim();

                // Skip if term already exists in dictionary or if extraction failed
                if (!term || !definition) return;
                if (existingTermsLower.has(term.toLowerCase())) return;

                suggestions.push({
                    term,
                    definition,
                    context: msg.content.slice(0, 100) + (msg.content.length > 100 ? '...' : '')
                });
            });
        });
    });

    return suggestions.slice(0, 5); // Limit to 5 suggestions
}

/**
 * Clear the cached client instance
 * Useful for testing or when API configuration changes
 */
export function clearSocraticClientCache(): void {
    cachedClient = null;
    lastConfig = null;
}
