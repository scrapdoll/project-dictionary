import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateQuiz, evaluateAnswer, QuizGeneration, QuizEvaluation } from './ai';

describe('AI Lib', () => {
    const mockFetch = vi.fn();
    const apiKey = 'test-key';
    const model = 'gpt-4o';
    const baseUrl = 'https://api.openai.com/v1';

    beforeEach(() => {
        global.fetch = mockFetch;
        mockFetch.mockReset();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('generateQuiz calls correct endpoint and returns parsed JSON', async () => {
        const mockResponse: QuizGeneration = {
            question: "Test Question?",
            type: "scenario"
        };

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                choices: [
                    {
                        message: {
                            content: JSON.stringify(mockResponse)
                        }
                    }
                ]
            })
        });

        const result = await generateQuiz('Apple', 'A fruit', apiKey, model, baseUrl, 'es-ES');

        expect(mockFetch).toHaveBeenCalledWith('/api/ai-proxy', expect.objectContaining({
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: expect.stringContaining('es-ES')
        }));

        expect(result).toEqual(mockResponse);
    });

    it('generateQuiz handles multiple choice type', async () => {
        const mockResponse: QuizGeneration = {
            question: "Choose correct meaning?",
            type: "multiple_choice",
            options: ["A", "B", "C", "D"]
        };

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                choices: [
                    {
                        message: {
                            content: JSON.stringify(mockResponse)
                        }
                    }
                ]
            })
        });

        const result = await generateQuiz('Apple', 'A fruit', apiKey, model, baseUrl);
        expect(result).toEqual(mockResponse);
        expect(result.options).toHaveLength(4);
    });

    it('evaluateAnswer calls correct endpoint and returns parsed JSON', async () => {
        const mockResponse: QuizEvaluation = {
            grade: 5,
            feedback: "Great job!",
            correctAnswer: "The ideal answer"
        };

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                choices: [
                    {
                        message: {
                            content: JSON.stringify(mockResponse)
                        }
                    }
                ]
            })
        });

        const result = await evaluateAnswer('Apple', 'Q?', 'A', apiKey, model, baseUrl);

        expect(mockFetch).toHaveBeenCalledWith('/api/ai-proxy', expect.any(Object));
        expect(result).toEqual(mockResponse);
    });

    it('throws error on failed fetch', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 500,
            statusText: 'Internal Server Error',
            json: async () => ({ details: 'Mock Error' })
        });

        await expect(generateQuiz('Term', 'Context', apiKey, model, baseUrl))
            .rejects.toThrow('AI API Error: 500 Internal Server Error');
    });
});
