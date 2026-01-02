import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { studyService } from '@/lib/services/study-service';
import { generateQuiz, evaluateAnswer } from '@/lib/ai';
import { Term, Progress, StudyState, QuizGeneration, QuizEvaluation } from '@/lib/types';

export function useStudySession() {
    const settings = useLiveQuery(() => db.settings.get(1));
    const [queue, setQueue] = useState<{ term: Term, progress: Progress }[]>([]);
    const [currentItem, setCurrentItem] = useState<{ term: Term, progress: Progress } | null>(null);

    const [mode, setMode] = useState<StudyState>('selection');
    const [sessionType, setSessionType] = useState<'ai' | 'standard'>('standard');
    const [aiQuiz, setAiQuiz] = useState<QuizGeneration | null>(null);
    const [userAnswer, setUserAnswer] = useState('');
    const [evaluation, setEvaluation] = useState<QuizEvaluation | null>(null);
    const [errorMsg, setErrorMsg] = useState('');
    const [xpReward, setXpReward] = useState(0);

    function startSession(type: 'ai' | 'standard') {
        console.log("Starting session with type:", type);
        setSessionType(type);
        loadDueItems(type);
    }

    async function loadDueItems(type: 'ai' | 'standard') {
        setMode('loading');
        setErrorMsg('');
        try {
            const items = await studyService.getDueItems(20);
            setQueue(items);
            if (items.length > 0) {
                // Pass type explicitly to avoid stale state issues in useAi calculation
                startItem(items[0], type);
            } else {
                setMode('finished');
            }
        } catch (err) {
            console.error(err);
            setErrorMsg("Failed to synchronize study queue.");
            setMode('error');
        }
    }

    async function startItem(item: { term: Term, progress: Progress }, typeOverride?: 'ai' | 'standard') {
        setCurrentItem(item);
        setUserAnswer('');
        setAiQuiz(null);
        setEvaluation(null);
        setMode('loading');

        // Refresh settings to ensure we have the latest
        const currentSettings = await db.settings.get(1);

        // Final check: Use override if coming from startSession/loadDueItems, else use sessionType
        const effectiveType = typeOverride || sessionType;
        const useAi = effectiveType === 'ai';

        console.log("Starting item. AI Mode:", useAi, "Type:", effectiveType);

        if (useAi) {
            if (!currentSettings?.apiKey) {
                setErrorMsg("AI Synchronizer offline: Missing API Key in settings.");
                setMode('error');
                return;
            }

            try {
                const quiz = await generateQuiz(
                    item.term.content,
                    item.term.context || '',
                    currentSettings.apiKey,
                    currentSettings.model,
                    currentSettings.apiBaseUrl,
                    currentSettings.language || 'en-US'
                );
                setAiQuiz(quiz);
                setMode('question');
            } catch (err) {
                console.error("AI Gen Failed", err);
                setErrorMsg("Neural link failed to generate context. Please check your connection or API configuration.");
                setMode('error');
            }
        } else {
            setMode('question');
        }
    }

    async function submitAnswer() {
        if (!currentItem) return;

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
                    currentSettings.apiBaseUrl,
                    currentSettings.language || 'en-US'
                );
                setEvaluation(ev);
                setMode('feedback');

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
    }

    function handleNext() {
        const nextQueue = queue.slice(1);
        setQueue(nextQueue);
        if (nextQueue.length > 0) {
            // No override needed here as sessionType is definitely set now
            startItem(nextQueue[0]);
        } else {
            setMode('finished');
        }
    }

    function resetToSelection() {
        setMode('selection');
        setErrorMsg('');
    }

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
        startSession,
        resetToSelection,
        retryLoad: () => loadDueItems(sessionType)
    };
}
