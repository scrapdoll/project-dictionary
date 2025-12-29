import { describe, it, expect } from 'vitest';
import { calculateNextReview } from './srs';

describe('SM-2 Algorithm (srs.ts)', () => {
    it('should initialize interval to 1 for first successful review (Grade 5)', () => {
        const result = calculateNextReview(5, 0, 2.5, 0);
        expect(result.interval).toBe(1);
        expect(result.repetition).toBe(1);
        expect(result.efactor).toBeGreaterThan(2.5);
    });

    it('should set interval to 6 for second successful review (Grade 4)', () => {
        const result = calculateNextReview(4, 1, 2.6, 1);
        expect(result.interval).toBe(6);
        expect(result.repetition).toBe(2);
    });

    it('should significantly increase interval for seasoned items', () => {
        const result = calculateNextReview(5, 5, 2.5, 20);
        expect(result.interval).toBe(Math.round(20 * 2.5)); // 50
        expect(result.repetition).toBe(6);
    });

    it('should reset repetition and interval on failure (Grade 0)', () => {
        const result = calculateNextReview(0, 5, 2.5, 50);
        expect(result.interval).toBe(1);
        expect(result.repetition).toBe(0);
        expect(result.efactor).toBeLessThan(2.5);
    });

    it('should not let efactor go below 1.3', () => {
        let result = { efactor: 1.3, repetition: 1, interval: 1, nextReview: 0 };
        // Repeatedly fail
        for (let i = 0; i < 10; i++) {
            result = calculateNextReview(0, result.repetition, result.efactor, result.interval);
        }
        expect(result.efactor).toBe(1.3);
    });
});
