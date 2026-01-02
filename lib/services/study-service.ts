import { db } from '../db';
import { calculateNextReview } from '../srs';
import { Term, Progress } from '../types';

export const studyService = {
    async getDueItems(limit: number = 20): Promise<{ term: Term; progress: Progress }[]> {
        const now = Date.now();
        const dueProgress = await db.progress.where('nextReview').belowOrEqual(now).sortBy('nextReview');

        const items: { term: Term; progress: Progress }[] = [];
        for (const p of dueProgress) {
            const term = await db.terms.get(p.termId);
            if (term) items.push({ term, progress: p });
            if (items.length >= limit) break;
        }
        return items;
    },

    async saveSessionProgress(
        termId: string,
        grade: number,
        currentProgress: Progress
    ): Promise<{ xpGained: number; nextReview: number }> {
        const xpGain = 10 + (Number(grade) * 2);

        await db.transaction('rw', db.progress, db.settings, async () => {
            const freshProgress = await db.progress.get(termId);
            // Fallback to currentProgress if fresh is missing (though it shouldn't be)
            const p = freshProgress || currentProgress;

            const result = calculateNextReview(
                grade,
                p.repetition,
                p.efactor,
                p.interval
            );

            const history = Array.isArray(p.history) ? p.history : [];

            await db.progress.put({
                termId: p.termId,
                nextReview: Math.floor(result.nextReview),
                interval: Math.floor(result.interval),
                repetition: Math.floor(result.repetition),
                efactor: result.efactor,
                history: [...history, { date: Date.now(), grade: Number(grade) }]
            });

            const currentSettings = await db.settings.get(1);
            if (currentSettings) {
                await db.settings.update(1, { xp: (currentSettings.xp || 0) + xpGain });
            } else {
                // Initialize default settings with first XP if they don't exist
                await db.settings.put({
                    id: 1,
                    apiKey: '',
                    apiBaseUrl: 'https://api.openai.com/v1',
                    model: 'gpt-4o',
                    aiEnabled: true,
                    language: 'en-US',
                    xp: xpGain
                });
            }
        });

        // We can calculate nextReview again or return what we computed, 
        // but specific return values might depend on how we want to update UI. 
        // For now, let's just return what the UI needs to show immediate feedback if needed.
        // Re-calculating result for return value since transaction doesn't return it easily.
        const result = calculateNextReview(
            grade,
            currentProgress.repetition,
            currentProgress.efactor,
            currentProgress.interval
        );

        return { xpGained: xpGain, nextReview: result.nextReview };
    }
};
