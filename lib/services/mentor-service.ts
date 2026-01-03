import { db } from '../db';
import { MentorChatSession, MentorChatMessage, MentorQuiz } from '../types';

export const mentorService = {
    async createSession(topic: string, language: string): Promise<string> {
        const sessionId = crypto.randomUUID();
        const session: MentorChatSession = {
            id: sessionId,
            topic,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            messageCount: 0,
            xpEarned: 0,
            language
        };
        await db.mentorChatSessions.add(session);
        return sessionId;
    },

    async addMessage(sessionId: string, message: Omit<MentorChatMessage, 'id' | 'sessionId'>): Promise<string> {
        const id = crypto.randomUUID();
        const fullMessage: MentorChatMessage = {
            id,
            sessionId,
            ...message
        };
        await db.mentorChatMessages.add(fullMessage);

        // Update session
        await db.mentorChatSessions.update(sessionId, {
            updatedAt: Date.now(),
            messageCount: await db.mentorChatMessages.where('sessionId').equals(sessionId).count()
        });

        return id;
    },

    async getSessionMessages(sessionId: string): Promise<MentorChatMessage[]> {
        return await db.mentorChatMessages
            .where('sessionId')
            .equals(sessionId)
            .sortBy('timestamp');
    },

    async getAllSessions(): Promise<MentorChatSession[]> {
        return await db.mentorChatSessions
            .orderBy('updatedAt')
            .reverse()
            .toArray();
    },

    async getSession(sessionId: string): Promise<MentorChatSession | undefined> {
        return await db.mentorChatSessions.get(sessionId);
    },

    async updateQuiz(sessionId: string, messageId: string, quiz: MentorQuiz): Promise<void> {
        const message = await db.mentorChatMessages.get(messageId);
        if (message && message.quiz) {
            const updatedQuiz = { ...message.quiz, ...quiz };
            await db.mentorChatMessages.update(messageId, {
                quiz: updatedQuiz
            });

            // Award XP for completed quiz
            if (quiz.completed && quiz.evaluation) {
                const session = await db.mentorChatSessions.get(sessionId);
                if (session) {
                    const xpGain = 15 + (quiz.evaluation.grade * 3);
                    await db.mentorChatSessions.update(sessionId, {
                        xpEarned: (session.xpEarned || 0) + xpGain
                    });

                    // Also update global XP
                    await db.settings.update(1, {
                        xp: await this.getTotalXp() + xpGain
                    });
                }
            }
        }
    },

    async getTotalXp(): Promise<number> {
        const settings = await db.settings.get(1);
        return settings?.xp || 0;
    },

    async deleteSession(sessionId: string): Promise<void> {
        await db.mentorChatMessages.where('sessionId').equals(sessionId).delete();
        await db.mentorChatSessions.delete(sessionId);
    }
};
