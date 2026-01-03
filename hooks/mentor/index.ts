/**
 * Mentor Hooks
 *
 * A collection of focused hooks for managing the mentor chat system.
 * Each hook handles a specific aspect of the mentor experience.
 */

export {
    useMentorChatState,
    type MentorChatStateValue,
    type MentorChatStateActions,
    type UseMentorChatStateReturn
} from './useMentorChatState';

export {
    useMentorQuizzes,
    type MentorQuizzesState,
    type MentorQuizzesActions,
    type UseMentorQuizzesReturn
} from './useMentorQuizzes';

export {
    useMentorTools,
    type TermSuggestion,
    type MentorToolsState,
    type MentorToolsActions,
    type UseMentorToolsReturn
} from './useMentorTools';
