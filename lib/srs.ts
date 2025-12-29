export interface ReviewResult {
    interval: number;
    repetition: number;
    efactor: number;
    nextReview: number;
}

/**
 * Calculates the next review schedule based on the SM-2 algorithm.
 * @param grade - Quality of response (0-5)
 *                5 - perfect response
 *                4 - correct response after hesitation
 *                3 - correct response recalled with serious difficulty
 *                2 - incorrect response; where the correct one seemed easy to recall
 *                1 - incorrect response; the correct one remembered
 *                0 - complete blackout.
 * @param previousRepetition - Current repetition count (default 0)
 * @param previousEFactor - Current easiness factor (default 2.5)
 * @param previousInterval - Current interval in days (default 0)
 */
export function calculateNextReview(
    grade: number,
    previousRepetition: number = 0,
    previousEFactor: number = 2.5,
    previousInterval: number = 0
): ReviewResult {
    let repetition = Number(previousRepetition) || 0;
    let efactor = Number(previousEFactor) || 2.5;
    let interval = Number(previousInterval) || 0;

    if (grade >= 3) {
        if (repetition === 0) {
            // New word
            if (grade === 5) interval = 4;
            else if (grade === 4) interval = 2;
            else interval = 1;
        } else if (repetition === 1) {
            // Second review
            if (grade === 5) interval = 10;
            else if (grade === 4) interval = 6;
            else interval = 4;
        } else {
            interval = Math.round(interval * efactor);
        }
        repetition += 1;
    } else {
        repetition = 0;
        interval = 1;
    }

    if (interval < 1) interval = 1;

    efactor = efactor + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));
    if (efactor < 1.3) efactor = 1.3;

    const nextDate = new Date(Date.now() + interval * 24 * 60 * 60 * 1000);
    nextDate.setHours(4, 0, 0, 0); // Available from 4:00 AM of that day
    const nextReview = nextDate.getTime();

    return {
        interval,
        repetition,
        efactor,
        nextReview,
    };
}
