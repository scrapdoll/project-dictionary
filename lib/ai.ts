import { QuizGeneration, QuizEvaluation } from './types';

export type { QuizGeneration, QuizEvaluation };


const SYSTEM_PROMPT_GENERATE = (term: string, context: string, language: string, preferredType?: string) => `
You are an expert language tutor. The user is learning the term "${term}".
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
}
`;

const SYSTEM_PROMPT_EVALUATE = (term: string, question: string, language: string) => `
You are a strict but fair teacher.
The term is "${term}".
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
}
`;

async function callLLM(
    messages: { role: string; content: string }[],
    apiKey: string,
    model: string,
    baseUrl: string
) {
    // Call our internal proxy to handle CORS and sanitization
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

export async function generateQuiz(
    term: string,
    context: string,
    apiKey: string,
    model: string,
    baseUrl: string = 'https://api.openai.com/v1',
    language: string = 'en-US',
    preferredType: QuizGeneration['type'] | 'auto' = 'auto'
): Promise<QuizGeneration> {
    const messages = [
        { role: 'system', content: SYSTEM_PROMPT_GENERATE(term, context, language, preferredType) },
        { role: 'user', content: 'Generate a question now.' }
    ];
    return callLLM(messages, apiKey, model, baseUrl);
}

export async function evaluateAnswer(
    term: string,
    question: string,
    userAnswer: string,
    apiKey: string,
    model: string,
    baseUrl: string = 'https://api.openai.com/v1',
    language: string = 'en-US'
): Promise<QuizEvaluation> {
    const messages = [
        { role: 'system', content: SYSTEM_PROMPT_EVALUATE(term, question, language) },
        { role: 'user', content: `The user answered: "${userAnswer}". Grade this.` }
    ];
    return callLLM(messages, apiKey, model, baseUrl);
}
