import { QuizGeneration, QuizEvaluation } from './types';

export type { QuizGeneration, QuizEvaluation };


const SYSTEM_PROMPT_GENERATE = (term: string, context: string) => `
You are an expert language tutor. The user is learning the term "${term}".
Context provided by user: "${context || 'None'}".
Generate a short, challenging quiz question to test their understanding of this term.
Do not ask for a simple definition if context is provided; ask them to apply it or fill in the blank, or explain a nuance.
Return ONLY a JSON object with this shape:
{
  "question": "The question text",
  "type": "scenario"
}
`;

const SYSTEM_PROMPT_EVALUATE = (term: string, question: string) => `
You are a strict but fair teacher.
The term is "${term}".
The question was: "${question}".
The user just answered.
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
  "feedback": "Short constructive feedback.",
  "correctAnswer": "The ideal answer."
}
`;

async function callLLM(
    messages: { role: string; content: string }[],
    apiKey: string,
    model: string,
    baseUrl: string
) {
    const url = baseUrl.replace(/\/$/, '') + '/chat/completions';

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model,
                messages,
                temperature: 0.7,
                response_format: { type: "json_object" }
            })
        });

        if (!response.ok) {
            throw new Error(`AI API Error: ${response.status} ${response.statusText}`);
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
    baseUrl: string = 'https://api.openai.com/v1'
): Promise<QuizGeneration> {
    const messages = [
        { role: 'system', content: SYSTEM_PROMPT_GENERATE(term, context) },
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
    baseUrl: string = 'https://api.openai.com/v1'
): Promise<QuizEvaluation> {
    const messages = [
        { role: 'system', content: SYSTEM_PROMPT_EVALUATE(term, question) },
        { role: 'user', content: `The user answered: "${userAnswer}". Grade this.` }
    ];
    return callLLM(messages, apiKey, model, baseUrl);
}
