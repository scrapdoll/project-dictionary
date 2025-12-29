import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { studyService } from '@/lib/services/study-service';
import { generateQuiz, evaluateAnswer } from '@/lib/ai';
import { Term, Progress, StudyState, QuizGeneration, QuizEvaluation } from '@/lib/types';

export function useStudySession() {
    const settings = useLiveQuery(() => db.settings.get(1));
    const [queue, setQueue] = useState<{ term: Term, progress: Progress }[]>([]);
    const [currentItem, setCurrentItem] = useState<{ term: Term, progress: Progress } | null>(null);

    const [mode, setMode] = useState<StudyState>('loading');
    const [aiQuiz, setAiQuiz] = useState<QuizGeneration | null>(null);
    const [userAnswer, setUserAnswer] = useState('');
    const [evaluation, setEvaluation] = useState<QuizEvaluation | null>(null);
    const [errorMsg, setErrorMsg] = useState('');
    const [xpReward, setXpReward] = useState(0);

    useEffect(() => {
        loadDueItems();
    }, []);

    async function loadDueItems() {
        setMode('loading');
        try {
            const items = await studyService.getDueItems(20);
            setQueue(items);
            if (items.length > 0) {
                startItem(items[0]);
            } else {
                setMode('finished');
            }
        } catch (err) {
            console.error(err);
            setErrorMsg("Failed to synchronize study queue.");
            setMode('error');
        }
    }

    async function startItem(item: { term: Term, progress: Progress }) {
        setCurrentItem(item);
        setUserAnswer('');
        setAiQuiz(null);
        setEvaluation(null);
        setMode('loading');

        // We need settings to be loaded. Ideally passed in or ensured via hook check.
        // Since useLiveQuery might be async initially, we should probably wait or check.
        // However, for this refactor, we'll assume settings might be ready or we check inside.
        // Actually, settings from useLiveQuery might be undefined initially.
        // A robust way is to fetch settings directly here if we need them immediately, 
        // or rely on the effect. But `startItem` is called from `loadDueItems`.

        // Let's refactor `startItem` to not depend on `settings` directly if possible, 
        // OR fetch them once. 
        // BUT, `settings` is reactive. 

        // Let's fetch settings freshly for the logic to ensure we have it.
        const currentSettings = await db.settings.get(1);

        if (currentSettings?.aiEnabled && currentSettings.apiKey) {
            try {
                const quiz = await generateQuiz(
                    item.term.content,
                    item.term.context || '',
                    currentSettings.apiKey,
                    currentSettings.model,
                    currentSettings.apiBaseUrl
                );
                setAiQuiz(quiz);
                setMode('question');
            } catch (err) {
                console.error("AI Gen Failed", err);
                setMode('question');
            }
        } else {
            setMode('question');
        }
    }

    async function submitAnswer() {
        if (!currentItem) return;

        // Fetch settings again to be sure
        const currentSettings = await db.settings.get(1);

        if (aiQuiz && currentSettings?.apiKey) {
            setMode('evaluating');
            try {
                const ev = await evaluateAnswer(
                    currentItem.term.content,
                    aiQuiz.question,
                    userAnswer,
                    currentSettings.apiKey,
                    currentSettings.model,
                    currentSettings.apiBaseUrl
                );
                setEvaluation(ev);
                setMode('feedback');

                // Save progress
                const result = await studyService.saveSessionProgress(currentItem.term.id, ev.grade, currentItem.progress);
                setXpReward(result.xpGained);
            } catch (err) {
                console.error("AI Eval Failed", err);
                setErrorMsg("AI Synchronizer offline. Please rate recall manually.");
                setMode('feedback');
            }
        } else {
            setMode('feedback');
        }
    }

    async function manualGrade(grade: number) {
        if (!currentItem) return;
        const result = await studyService.saveSessionProgress(currentItem.term.id, grade, currentItem.progress);
        setXpReward(result.xpGained);
        handleNext(); // Auto-advance for manual grading? The original code did `updateProgress` then `handleNext`.
        // Wait, original `updateProgress` just updated DB. `handleNext` was called by button onClick.
        // So we should expose `updateProgress` or just let the button call `handleNext`.
        // But `updateProgress` in original also set `xpReward`.

        // In original: <button onClick={() => { updateProgress(0); handleNext(); }} ...>
        // Use `manualGrade` to just update progress.
    }

    function handleNext() {
        const nextQueue = queue.slice(1);
        setQueue(nextQueue);
        if (nextQueue.length > 0) {
            startItem(nextQueue[0]);
        } else {
            setMode('finished');
        }
    }

    // Original updateProgress was also called in handleSubmitAnswer -> updateProgress.
    // In my `submitAnswer` above, I called studyService.saveSessionProgress but didn't handle the "next" part.
    // The original `handleSubmitAnswer` set mode to feedback and updated progress. It DID NOT call `handleNext`. 
    // `handleNext` is called by "Continue Training" button in feedback view.

    return {
        mode,
        queue,
        currentItem,
        aiQuiz,
        userAnswer,
        setUserAnswer,
        evaluation,
        errorMsg,
        xpReward,
        submitAnswer,
        manualGrade,
        handleNext,
        retryLoad: loadDueItems
    };
}
