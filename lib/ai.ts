/**
 * Study AI Module
 * Provides AI-powered quiz generation and evaluation
 *
 * This module now uses the centralized StudyAIClient from lib/ai-client
 * to avoid code duplication and provide consistent error handling.
 */

import { createStudyClient, StudyAIClient } from './ai-client';
import { QuizGeneration, QuizEvaluation } from './types';

export type { QuizGeneration, QuizEvaluation };

/**
 * Default model to use if not specified
 */
const DEFAULT_MODEL = 'gpt-4o';
const DEFAULT_BASE_URL = 'https://api.openai.com/v1';

/**
 * Client cache for reusing the same client instance
 */
let cachedClient: StudyAIClient | null = null;

/**
 * Get or create a StudyAIClient instance
 *
 * @param apiKey - OpenAI-compatible API key
 * @param model - Model identifier
 * @param baseUrl - API base URL
 * @returns StudyAIClient instance
 */
function getClient(apiKey: string, model: string, baseUrl: string): StudyAIClient {
    const config = { apiKey, model, baseUrl };

    // Return cached client if config matches
    if (cachedClient) {
        const currentConfig = cachedClient.getConfig();
        if (currentConfig.apiKey === apiKey && currentConfig.model === model && currentConfig.baseUrl === baseUrl) {
            return cachedClient;
        }
    }

    cachedClient = createStudyClient(config);
    return cachedClient;
}

/**
 * Generate a quiz question for a given term
 *
 * @param term - The vocabulary term content
 * @param context - Additional context about the term
 * @param apiKey - OpenAI-compatible API key
 * @param model - Model identifier
 * @param baseUrl - API base URL (defaults to OpenAI)
 * @param language - Response language (BCP 47 tag)
 * @param preferredType - Preferred quiz type ('auto' for any)
 * @returns Generated quiz with question and type
 *
 * @example
 * ```ts
 * const quiz = await generateQuiz(
 *   'ephemeral',
 *   'lasting for a very short time',
 *   'sk-...',
 *   'gpt-4o'
 * );
 * ```
 */
export async function generateQuiz(
    term: string,
    context: string,
    apiKey: string,
    model: string = DEFAULT_MODEL,
    baseUrl: string = DEFAULT_BASE_URL,
    language: string = 'en-US',
    preferredType: QuizGeneration['type'] | 'auto' = 'auto'
): Promise<QuizGeneration> {
    const client = getClient(apiKey, model, baseUrl);
    return client.generateQuiz({ content: term, definition: context }, language, preferredType);
}

/**
 * Evaluate a user's answer to a quiz question
 *
 * @param term - The vocabulary term content
 * @param question - The quiz question asked
 * @param userAnswer - The user's response
 * @param apiKey - OpenAI-compatible API key
 * @param model - Model identifier
 * @param baseUrl - API base URL (defaults to OpenAI)
 * @param language - Feedback language
 * @returns Evaluation with grade (0-5), feedback, and correct answer
 *
 * @example
 * ```ts
 * const evaluation = await evaluateAnswer(
 *   'ephemeral',
 *   'What does "ephemeral" mean?',
 *   'It means something that lasts forever',
 *   'sk-...',
 *   'gpt-4o'
 * );
 * // { grade: 1, feedback: 'Not quite - it means lasting for a short time', correctAnswer: '...' }
 * ```
 */
export async function evaluateAnswer(
    term: string,
    question: string,
    userAnswer: string,
    apiKey: string,
    model: string = DEFAULT_MODEL,
    baseUrl: string = DEFAULT_BASE_URL,
    language: string = 'en-US'
): Promise<QuizEvaluation> {
    const client = getClient(apiKey, model, baseUrl);
    return client.evaluateAnswer({ content: term, definition: '' }, question, userAnswer, language);
}
