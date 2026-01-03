/**
 * Study AI Client
 * Handles AI-powered quiz generation and evaluation for study sessions
 */

import { AIClient, AIConfig, LLMMessage } from './base';
import { QuizGeneration, QuizEvaluation } from '@/lib/types';
import { logError } from '@/lib/errors';

/**
 * Supported quiz types for study sessions
 */
export type StudyQuizType = 'auto' | 'definition' | 'context' | 'scenario' | 'multiple_choice' | 'cloze';

/**
 * Study AI Client
 * Specialized for generating and evaluating study quizzes
 */
export class StudyAIClient extends AIClient {
    constructor(config: AIConfig) {
        super(config);
    }

    /**
     * Generate a quiz question for a given term
     *
     * @param term - The vocabulary term to quiz
     * @param context - Additional context about the term
     * @param language - Response language (BCP 47 tag)
     * @param preferredType - Preferred quiz type (or 'auto' for any)
     * @returns Generated quiz with question and type
     *
     * @example
     * ```ts
     * const quiz = await studyClient.generateQuiz(
     *   { content: 'ephemeral', definition: 'lasting for a very short time' },
     *   'Learning about time-related adjectives',
     *   'en-US',
     *   'auto'
     * );
     * ```
     */
    async generateQuiz(
        term: { content: string; definition: string; context?: string },
        language: string,
        preferredType: StudyQuizType = 'auto'
    ): Promise<QuizGeneration> {
        const messages: LLMMessage[] = [
            {
                role: 'system',
                content: this.buildQuizPrompt(term.content, term.definition, term.context || '', language, preferredType)
            },
            {
                role: 'user',
                content: 'Generate a question now.'
            }
        ];

        try {
            const response = await this.callLLM(messages, { temperature: 0.8 });

            if (!response.content) {
                throw new Error('Empty response from AI');
            }

            const quiz = this.parseJSONResponse<QuizGeneration>(response.content);

            // Validate quiz structure
            if (!quiz.question || !quiz.type) {
                throw new Error('Invalid quiz format: missing required fields');
            }

            // Ensure multiple choice quizzes have options
            if (quiz.type === 'multiple_choice' && (!quiz.options || quiz.options.length !== 4)) {
                throw new Error('Multiple choice quizzes must have exactly 4 options');
            }

            return quiz;

        } catch (error) {
            logError(error as Error, 'StudyAIClient.generateQuiz');
            throw error;
        }
    }

    /**
     * Evaluate a user's answer to a quiz question
     *
     * @param term - The vocabulary term
     * @param question - The quiz question asked
     * @param userAnswer - The user's response
     * @param language - Feedback language
     * @returns Evaluation with grade (0-5), feedback, and correct answer
     *
     * @example
     * ```ts
     * const evaluation = await studyClient.evaluateAnswer(
     *   { content: 'ephemeral', definition: '...' },
     *   'What does "ephemeral" mean?',
     *   'It means something that lasts forever',
     *   'en-US'
     * );
     * // { grade: 1, feedback: 'Not quite - it means lasting for a short time', correctAnswer: '...' }
     * ```
     */
    async evaluateAnswer(
        term: { content: string; definition: string },
        question: string,
        userAnswer: string,
        language: string
    ): Promise<QuizEvaluation> {
        const messages: LLMMessage[] = [
            {
                role: 'system',
                content: this.buildEvaluationPrompt(term.content, term.definition, question, language)
            },
            {
                role: 'user',
                content: `The user answered: "${userAnswer}". Grade this.`
            }
        ];

        try {
            const response = await this.callLLM(messages, { temperature: 0.6 });

            if (!response.content) {
                throw new Error('Empty response from AI');
            }

            const evaluation = this.parseJSONResponse<QuizEvaluation>(response.content);

            // Validate evaluation structure
            if (typeof evaluation.grade !== 'number' || evaluation.grade < 0 || evaluation.grade > 5) {
                throw new Error(`Invalid grade: ${evaluation.grade}. Must be 0-5.`);
            }

            if (!evaluation.feedback) {
                evaluation.feedback = this.getDefaultFeedback(evaluation.grade);
            }

            return evaluation;

        } catch (error) {
            logError(error as Error, 'StudyAIClient.evaluateAnswer');
            throw error;
        }
    }

    /**
     * Build the system prompt for quiz generation
     */
    private buildQuizPrompt(
        term: string,
        definition: string,
        context: string,
        language: string,
        preferredType: StudyQuizType
    ): string {
        return `You are an expert language tutor. The user is learning the term "${term}".
Definition: "${definition}".
Context provided by user: "${context || 'None'}".
Your output language is: "${language}".

${preferredType && preferredType !== 'auto' ? `The user PREFERS a "${preferredType}" type question. You MUST generate a question of type "${preferredType}".` : 'Generate a short, challenging quiz question to test their understanding of this term.'}

Guidelines for question types:
- "definition": Ask about the precise meaning, nuances, or how it differs from synonyms.
- "context": Ask the user to apply the term in a specific sentence or explain its role in a given phrase.
- "scenario": Create a mini role-play or a realistic situation where the user must use or identify the term.
- "multiple_choice": Ask a question and provide 4 distinct options. One must be correct.
- "cloze": Provide a sentence where the term "${term}" (or its form) is missing, replaced by "____". The user must identify the missing word.

If the type is "multiple_choice", you MUST provide 4 distinct options in the "options" field.
Do not ask for a simple definition if context is provided; ask them to apply it or explain a nuance.

Return ONLY a JSON object with this shape:
{
  "question": "The question or cloze sentence text (in ${language})",
  "type": "scenario" | "multiple_choice" | "definition" | "context" | "cloze",
  "options": ["option 1", "option 2", "option 3", "option 4"] // only if type is multiple_choice
}`;
    }

    /**
     * Build the system prompt for answer evaluation
     */
    private buildEvaluationPrompt(
        term: string,
        definition: string,
        question: string,
        language: string
    ): string {
        return `You are a strict but fair teacher.
The term is "${term}".
Definition: "${definition}".
The question was: "${question}".
The user just answered.
Your feedback must be in this language: "${language}".
Evaluate the answer on a scale of 0 to 5 based on SuperMemo standards:
5 - Perfect response
4 - Correct response after hesitation (or minor flaw)
3 - Correct response recalled with serious difficulty
2 - Incorrect response; where the correct one seemed easy to recall
1 - Incorrect response; the correct one remembered / partial truth
0 - Complete blackout / wrong.

Return ONLY a JSON object:
{
  "grade": number,
  "feedback": "Short constructive feedback in ${language}.",
  "correctAnswer": "The ideal answer."
}`;
    }

    /**
     * Get default feedback message based on grade
     */
    private getDefaultFeedback(grade: number): string {
        const feedback = [
            'Keep studying - this one needs more work.',
            'Not quite - review this term again.',
            'Getting there, but needs more practice.',
            'Good effort! Review to strengthen.',
            'Very good - almost perfect!',
            'Excellent! Perfect response!'
        ];
        return feedback[Math.min(grade, 5)] || feedback[0];
    }
}

/**
 * Factory function to create a Study AI client
 *
 * @param config - AI configuration
 * @returns Configured StudyAIClient instance
 *
 * @example
 * ```ts
 * const studyClient = createStudyClient({
 *   apiKey: 'sk-...',
 *   model: 'gpt-4o',
 *   baseUrl: 'https://api.openai.com/v1'
 * });
 *
 * const quiz = await studyClient.generateQuiz(term, 'en-US', 'auto');
 * ```
 */
export function createStudyClient(config: AIConfig): StudyAIClient {
    return new StudyAIClient(config);
}
