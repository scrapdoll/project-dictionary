/**
 * Socratic AI Client
 * Handles AI mentor interactions using the Socratic teaching method
 */

import { AIClient, AIConfig, LLMMessage, LLMTool, LLMToolCall } from './base';
import {
    MentorChatMessage,
    SocraticMentorResponse,
    MentorToolAction,
    MentorQuiz,
    AddTermData,
    CreateQuizData,
    HighlightConceptData,
    SuggestPracticeData
} from '@/lib/types';
import { logError } from '@/lib/errors';

/**
 * Conversation context for tracking Socratic dialogue state
 */
interface SocraticConversationContext {
    topic: string;
    conceptsIntroduced: string[];
    questionsAsked: string[];
    userResponses: string[];
    currentLevel: 'beginner' | 'intermediate' | 'advanced';
}

/**
 * Socratic AI Client
 * Specialized for Socratic method teaching with tool calling
 */
export class SocraticAIClient extends AIClient {
    private readonly TOOLS: LLMTool[] = [
        {
            type: "function",
            function: {
                name: "add_term",
                description: "Add a new term to the user's personal dictionary for spaced repetition learning. Use this when: (1) User explicitly asks to add a term, (2) A new important concept/term is introduced during teaching, (3) User asks about a specific technical term. Check existingTerms list first to avoid duplicates.",
                parameters: {
                    type: "object",
                    properties: {
                        term: { type: "string", description: "The name of the term/concept to add" },
                        definition: { type: "string", description: "Clear, concise definition that captures the essence of the term" },
                        context: { type: "string", description: "Example sentence, use case, or additional context to help understand the term" }
                    },
                    required: ["term", "definition", "context"]
                }
            }
        },
        {
            type: "function",
            function: {
                name: "create_quiz",
                description: "Create a quiz to test the user's understanding at natural checkpoints",
                parameters: {
                    type: "object",
                    properties: {
                        quizType: {
                            type: "string",
                            enum: ["multiple_choice", "cloze", "short_answer", "matching", "ordering"],
                            description: "Type of quiz to create"
                        },
                        focus: { type: "string", description: "What specific concept to test" },
                        question: { type: "string", description: "The quiz question (optional)" },
                        options: { type: "array", items: { type: "string" }, description: "Answer options (required for multiple_choice)" },
                        correctAnswer: { type: "number", description: "0-indexed index of the correct answer in the options array (required for multiple_choice)" },
                        pairs: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: { left: { type: "string" }, right: { type: "string" } },
                                required: ["left", "right"]
                            }
                        },
                        items: { type: "array", items: { type: "string" } },
                        correctOrder: { type: "array", items: { type: "number" } }
                    },
                    required: ["quizType", "focus"]
                }
            }
        },
        {
            type: "function",
            function: {
                name: "highlight_concept",
                description: "Emphasize an important concept or connection",
                parameters: {
                    type: "object",
                    properties: {
                        concept: { type: "string", description: "Name of the concept" },
                        importance: { type: "string", description: "Why it matters" }
                    },
                    required: ["concept", "importance"]
                }
            }
        },
        {
            type: "function",
            function: {
                name: "suggest_practice",
                description: "Recommend an exercise for the user to practice",
                parameters: {
                    type: "object",
                    properties: {
                        exercise: { type: "string", description: "What exercise to practice" },
                        reason: { type: "string", description: "Why this helps" }
                    },
                    required: ["exercise", "reason"]
                }
            }
        }
    ];

    constructor(config: AIConfig) {
        super(config);
    }

    /**
     * Get a Socratic mentor response for the user's message
     *
     * @param topic - The learning topic
     * @param userMessage - The user's current message
     * @param conversationHistory - Previous messages in the conversation
     * @param language - Response language (BCP 47 tag)
     * @param existingTerms - Terms already in the user's dictionary
     * @returns Mentor response with optional tool actions and quizzes
     *
     * @example
     * ```ts
     * const response = await socraticClient.getResponse(
     *   'Python programming',
     *   'What is a variable?',
     *   history,
     *   'en-US',
     *   ['function', 'loop', 'class']
     * );
     * ```
     */
    async getResponse(
        topic: string,
        userMessage: string,
        conversationHistory: MentorChatMessage[],
        language: string = 'en-US',
        existingTerms: string[] = []
    ): Promise<SocraticMentorResponse> {
        const context = this.buildConversationContext(conversationHistory);
        context.topic = topic;

        const messages: LLMMessage[] = [
            {
                role: 'system',
                content: this.buildSocraticPrompt(topic, language, context, existingTerms)
            },
            ...conversationHistory.slice(-15).map(m => ({
                role: m.role,
                content: m.content || ''
            })),
            { role: 'user', content: userMessage }
        ];

        try {
            const response = await this.callLLM(messages, {
                tools: this.TOOLS,
                toolChoice: 'auto',
                temperature: 0.7
            });

            return this.processSocraticResponse(response, topic, conversationHistory, language);

        } catch (error) {
            logError(error as Error, 'SocraticAIClient.getResponse');
            return this.getFallbackResponse(language);
        }
    }

    /**
     * Evaluate a quiz answer from the user
     *
     * @param quiz - The quiz being evaluated
     * @param userAnswer - The user's response
     * @param language - Feedback language
     * @returns Evaluation with grade, feedback, and correct answer
     */
    async evaluateQuizAnswer(
        quiz: MentorQuiz,
        userAnswer: string,
        language: string = 'en-US'
    ): Promise<MentorQuiz['evaluation']> {
        const messages: LLMMessage[] = [
            {
                role: 'system',
                content: this.buildQuizEvaluationPrompt(quiz, language)
            },
            {
                role: 'user',
                content: `User's answer: "${userAnswer}"`
            }
        ];

        try {
            const response = await this.callLLM(messages, { temperature: 0.5 });

            if (!response.content) {
                throw new Error('Empty response from AI');
            }

            return this.parseJSONResponse<MentorQuiz['evaluation']>(response.content);

        } catch (error) {
            logError(error as Error, 'SocraticAIClient.evaluateQuizAnswer');
            throw error;
        }
    }

    /**
     * Build conversation context from message history
     */
    private buildConversationContext(messages: MentorChatMessage[]): SocraticConversationContext {
        const context: SocraticConversationContext = {
            topic: '',
            conceptsIntroduced: [],
            questionsAsked: [],
            userResponses: [],
            currentLevel: 'beginner'
        };

        messages.forEach(msg => {
            if (!msg.content) return;

            if (msg.role === 'assistant') {
                const questionMatches = msg.content.match(/[^.?!]*\?/g);
                if (questionMatches) {
                    context.questionsAsked.push(...questionMatches);
                }
            } else if (msg.role === 'user') {
                context.userResponses.push(msg.content);
            }
        });

        if (messages.length > 15) {
            context.currentLevel = 'advanced';
        } else if (messages.length > 7) {
            context.currentLevel = 'intermediate';
        }

        return context;
    }

    /**
     * Build the Socratic method system prompt
     */
    private buildSocraticPrompt(
        topic: string,
        language: string,
        context: SocraticConversationContext,
        existingTerms: string[]
    ): string {
        return `You are SOCRATES, an AI mentor who teaches through the Socratic method - by asking thoughtful questions rather than giving direct answers.

**Topic:** "${topic}"
**Language:** Respond in "${language}"
**Current Level:** ${context.currentLevel}
**Concepts Covered:** ${context.conceptsIntroduced.length > 0 ? context.conceptsIntroduced.join(', ') : 'None yet'}
**Terms Already in Dictionary:** ${existingTerms.length > 0 ? existingTerms.join(', ') : 'None'}

=== CRITICAL: IMMEDIATE TOOL EXECUTION ===

When the user makes a DIRECT REQUEST, execute the appropriate tool IMMEDIATELY without Socratic questioning:
- "Add [term] to dictionary" → CALL add_term tool immediately
- "Create a quiz" → CALL create_quiz tool immediately
- "Test me" or "Quiz me" → CALL create_quiz tool immediately
- Any direct action request → Execute tool, don't ask questions

The Socratic method applies to TEACHING and EXPLORING, not to direct tool requests!

=== SOCRATIC METHOD PRINCIPLES (for teaching/exploring) ===

1. NEVER give direct answers immediately. Guide through questions.
2. Start with what the user already knows
3. Break complex ideas into smaller steps
4. Use analogies and real-world examples
5. Celebrate insights and "aha moments"
6. When user struggles, provide a hint question, not the answer

=== USING TOOLS ===

You have access to tools that can help enhance the learning experience. Use them strategically:

- **add_term**: When a NEW key concept, technical term, or important vocabulary emerges (NOT already in dictionary!), IMMEDIATELY call this tool. Examples: programming concepts, scientific terms, historical figures, etc.
- **create_quiz**: Test understanding at natural checkpoints or when user asks for a challenge
- **highlight_concept**: Emphasize important connections
- **suggest_practice**: Recommend exercises

IMPORTANT: When you identify a new term worth learning, CALL the add_term tool - don't just mention it in text! The tool will show the user a card they can add to their dictionary.

Only call tools when they add value to the learning experience.

=== TOOL USAGE EXAMPLES ===

Example 1 - DIRECT REQUEST (execute immediately):
User: "Add 'recursion' to my dictionary"
AI: (IMMEDIATELY calls add_term tool, no questions)

Example 2 - User asks about a specific term:
User: "What is a closure?"
AI: "That's a great question! A closure is..." (explains, then calls add_term tool)

Example 3 - User wants to learn about a topic (use Socratic):
User: "Teach me about React hooks"
AI: "Great topic! Let's start with a question - what do you think a 'hook' might be in programming?"

Example 4 - User asks for a quiz:
User: "Test me on what we covered"
AI: (IMMEDIATELY calls create_quiz tool)

=== QUESTION CRAFTING (for teaching/exploring) ===

Good Socratic questions:
- "What do you think might happen if...?"
- "How would you explain this to a beginner?"
- "Can you think of a real-world example?"
- "What's the connection between X and Y?"
- "Why do you think that's the case?"

Bad questions:
- Yes/no questions (unless checking understanding)
- Too vague ("What do you think?")
- Overwhelming (ask one thing at a time)

=== QUIZ TYPES ===

Only create quizzes when:
- User asks for a challenge
- Natural checkpoint in learning
- 3+ concepts have been discussed

Types:
- "multiple_choice": Test recognition
- "cloze": Fill in key term (use "____" for blank)
- "short_answer": Test understanding
- "matching": Pair related items
- "ordering": Put steps in sequence

=== LEVEL ADAPTATION ===

Beginner: Simple questions, build confidence
Intermediate: Connect concepts, some challenges
Advanced: Complex scenarios, synthesis

Current conversation context:
- Questions asked: ${context.questionsAsked.length}
- User responses: ${context.userResponses.length}

Adjust difficulty based on user's responses. If they're struggling, simplify. If they're excelling, challenge them.

Remember: You are the guide, not the lecturer. The goal is for the USER to discover understanding through YOUR questions.`;
    }

    /**
     * Build quiz evaluation system prompt
     */
    private buildQuizEvaluationPrompt(quiz: MentorQuiz, language: string): string {
        return `You are evaluating a quiz answer in a learning context.
Quiz type: ${quiz.type}
Question: ${quiz.question}
${quiz.options ? `Options: ${quiz.options.join(', ')}` : ''}
Language: ${language}

Grade 0-5 based on understanding demonstrated:
5 - Perfect! Shows complete understanding
4 - Correct with minor hesitation or incomplete explanation
3 - Correct answer but with clear difficulty
2 - Incorrect, but shows some familiarity with concept
1 - Incorrect, partial truth or related concept
0 - No understanding demonstrated or guess

Return JSON:
{
  "grade": number (0-5),
  "feedback": "constructive, encouraging feedback in ${language}. Be specific about what was good or what to improve",
  "correctAnswer": "the ideal answer or explanation"
}

Be encouraging! Even wrong answers are learning opportunities.`;
    }

    /**
     * Process the LLM response and extract tool actions
     */
    private processSocraticResponse(
        response: { content?: string; toolCalls?: LLMToolCall[] },
        topic: string,
        conversationHistory: MentorChatMessage[],
        language: string = 'en-US'
    ): SocraticMentorResponse {
        let toolAction: MentorToolAction | undefined = undefined;
        let shouldCreateQuiz = false;
        let quiz: SocraticMentorResponse['quiz'] | undefined = undefined;

        if (response.toolCalls && response.toolCalls.length > 0) {
            for (const toolCall of response.toolCalls) {
                const functionName = toolCall.function.name;
                const functionArgs = JSON.parse(toolCall.function.arguments);

                switch (functionName) {
                    case 'add_term':
                        const addTermData = functionArgs as AddTermData;
                        toolAction = {
                            type: 'add_term',
                            data: { term: addTermData.term, definition: addTermData.definition, context: addTermData.context }
                        };
                        break;

                    case 'create_quiz':
                        shouldCreateQuiz = true;
                        quiz = this.generateQuizFromTool(functionArgs as CreateQuizData);
                        break;

                    case 'highlight_concept':
                        const highlightData = functionArgs as HighlightConceptData;
                        toolAction = {
                            type: 'highlight_concept',
                            data: { concept: highlightData.concept, importance: highlightData.importance }
                        };
                        break;

                    case 'suggest_practice':
                        const practiceData = functionArgs as SuggestPracticeData;
                        toolAction = {
                            type: 'suggest_practice',
                            data: { exercise: practiceData.exercise, reason: practiceData.reason }
                        };
                        break;
                }
            }
        }

        const content = response.content || '';
        if (content.trim().length === 0) {
            // If there's a tool action but no content, just return the action without fallback message
            if (toolAction || shouldCreateQuiz) {
                return {
                    message: '',
                    toolAction,
                    shouldCreateQuiz,
                    quiz
                };
            }
            // Otherwise, return fallback response
            return this.getFallbackResponse(language, toolAction, shouldCreateQuiz, quiz);
        }

        return {
            message: content,
            toolAction,
            shouldCreateQuiz,
            quiz
        };
    }

    /**
     * Generate quiz data from tool call parameters
     */
    private generateQuizFromTool(data: CreateQuizData): Omit<MentorQuiz, 'id' | 'completed' | 'userAnswer' | 'evaluation'> {
        const quizType = data.quizType || 'multiple_choice';

        switch (quizType) {
            case 'matching':
                return {
                    type: 'matching',
                    question: data.question || `Match the related items about ${data.focus}:`,
                    pairs: data.pairs || [
                        { left: 'Concept A', right: 'Definition A' },
                        { left: 'Concept B', right: 'Definition B' },
                        { left: 'Concept C', right: 'Definition C' },
                        { left: 'Concept D', right: 'Definition D' }
                    ]
                };

            case 'ordering':
                return {
                    type: 'ordering',
                    question: data.question || `Put these steps in the correct order:`,
                    items: data.items || ['Step 1', 'Step 2', 'Step 3', 'Step 4'],
                    correctOrder: data.correctOrder || [0, 1, 2, 3]
                };

            case 'cloze':
                return {
                    type: 'cloze',
                    question: data.question || `Complete the sentence: "The ____ is important because ____"`
                };

            case 'short_answer':
                return {
                    type: 'short_answer',
                    question: data.question || `Explain in your own words: ${data.focus}`
                };

            case 'multiple_choice':
            default:
                return {
                    type: 'multiple_choice',
                    question: data.question || `What is the correct understanding of ${data.focus}?`,
                    options: data.options || ['Option A', 'Option B', 'Option C', 'Option D'],
                    correctAnswer: data.options ? data.correctAnswer : (data.correctAnswer ?? 0)
                };
        }
    }

    /**
     * Get fallback response when AI fails
     */
    private getFallbackResponse(
        language: string,
        toolAction?: MentorToolAction,
        shouldCreateQuiz = false,
        quiz?: SocraticMentorResponse['quiz']
    ): SocraticMentorResponse {
        const isRussian = language.startsWith('ru');
        return {
            message: isRussian
                ? 'Давай подумаем об этом вместе. Что ты уже знаешь об этой теме?'
                : "Let's think about this together. What do you already know about this topic?",
            socraticQuestion: isRussian
                ? 'С чего бы ты хотел начать?'
                : "Where would you like to start?",
            toolAction,
            shouldCreateQuiz,
            quiz
        };
    }
}

/**
 * Factory function to create a Socratic AI client
 *
 * @param config - AI configuration
 * @returns Configured SocraticAIClient instance
 *
 * @example
 * ```ts
 * const socraticClient = createSocraticClient({
 *   apiKey: 'sk-...',
 *   model: 'gpt-4o',
 *   baseUrl: 'https://api.openai.com/v1'
 * });
 *
 * const response = await socraticClient.getResponse('Python', 'What is a variable?', [], 'en-US');
 * ```
 */
export function createSocraticClient(config: AIConfig): SocraticAIClient {
    return new SocraticAIClient(config);
}
