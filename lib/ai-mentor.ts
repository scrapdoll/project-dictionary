import { MentorQuiz, MentorChatMessage } from './types';

export interface MentorChatResponse {
    message: string;
    shouldCreateQuiz: boolean;
    quiz?: Omit<MentorQuiz, 'id' | 'completed' | 'userAnswer' | 'evaluation'>;
    suggestedTopics?: string[];
}

const SYSTEM_PROMPT_MENTOR = (topic: string, language: string, conversationSummary: string) => `
You are a supportive AI mentor helping the user learn about "${topic}".
Response language: "${language}"
Recent conversation context: ${conversationSummary || 'Starting new conversation'}

Your primary role is to be a conversational mentor:
1. Engage in natural dialogue about the topic
2. Answer questions clearly and thoroughly
3. Ask follow-up questions to deepen understanding
4. Guide the learning flow based on user's interest
5. Be friendly, patient, and encouraging

QUIZZES SHOULD BE RARE. Only create a quiz when:
- The user explicitly asks to test their knowledge
- After a substantial explanation (5+ exchanges) to consolidate learning
- When the user seems ready to challenge themselves

Most of the time, shouldCreateQuiz should be false. Focus on being a great conversation partner first.

Quiz types available:
- "multiple_choice": Test recognition of concepts (provide 4 options)
- "cloze": Fill-in-the-blank for key terms (use "____" for the blank)
- "definition": Check understanding of terminology
- "context": Apply knowledge to scenarios
- "scenario": Real-world application

Response format (JSON):
{
  "message": "Your conversational response in ${language}",
  "shouldCreateQuiz": true/false,
  "quiz": {
    "type": "quiz_type",
    "question": "question text",
    "options": ["A", "B", "C", "D"] // only for multiple_choice
  },
  "suggestedTopics": ["topic1", "topic2"] // optional learning paths
}

Keep responses concise (2-3 sentences unless explaining something complex).
Be encouraging and friendly!
`;

const SYSTEM_PROMPT_QUIZ_EVAL = (quizType: string, question: string, language: string) => `
You are evaluating a quiz answer in a learning context.
Quiz type: ${quizType}
Question: ${question}
Language: ${language}

Grade 0-5 based on understanding demonstrated:
5 - Perfect, shows deep understanding
4 - Correct with minor hesitation
3 - Correct but with difficulty
2 - Incorrect, but concept is familiar
1 - Incorrect, partial truth
0 - Complete blackout

Return JSON:
{
  "grade": number,
  "feedback": "constructive feedback in ${language}",
  "correctAnswer": "ideal answer"
}
`;

async function callLLM(
    messages: { role: string; content: string }[],
    apiKey: string,
    model: string,
    baseUrl: string
): Promise<any> {
    const url = '/api/ai-proxy';

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messages,
                apiKey,
                model,
                baseUrl
            })
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(`AI API Error: ${response.status} ${response.statusText} ${errData.details || ''}`);
        }

        const data = await response.json();
        const content = data.choices[0].message.content;
        return JSON.parse(content);
    } catch (error) {
        console.error("LLM Call Failed", error);
        throw error;
    }
}

export async function mentorChatResponse(
    topic: string,
    userMessage: string,
    conversationHistory: MentorChatMessage[],
    apiKey: string,
    model: string,
    baseUrl: string,
    language: string = 'en-US'
): Promise<MentorChatResponse> {
    // Format conversation history for context
    const historySummary = conversationHistory
        .slice(-6) // Last 6 messages for context
        .filter(m => m.role !== 'system')
        .map(m => `${m.role}: ${m.content.slice(0, 100)}${m.content.length > 100 ? '...' : ''}`)
        .join('\n');

    const messages = [
        {
            role: 'system',
            content: SYSTEM_PROMPT_MENTOR(topic, language, historySummary)
        },
        ...conversationHistory.slice(-10).map(m => ({
            role: m.role,
            content: m.content
        })),
        { role: 'user', content: userMessage }
    ];

    return callLLM(messages, apiKey, model, baseUrl);
}

export async function evaluateMentorQuiz(
    quiz: MentorQuiz,
    userAnswer: string,
    apiKey: string,
    model: string,
    baseUrl: string,
    language: string = 'en-US'
): Promise<MentorQuiz['evaluation']> {
    const messages = [
        {
            role: 'system',
            content: SYSTEM_PROMPT_QUIZ_EVAL(quiz.type, quiz.question, language)
        },
        { role: 'user', content: `The user answered: "${userAnswer}". Grade this.` }
    ];

    return callLLM(messages, apiKey, model, baseUrl);
}
