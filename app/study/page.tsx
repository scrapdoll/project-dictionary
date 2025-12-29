'use client';

import StudySession from '@/components/StudySession';
import { motion } from 'framer-motion';

export default function StudyPage() {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-3xl mx-auto"
        >
            <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold text-gradient mb-2">Study Session</h1>
                <p className="text-gray-400">Focus on recalling what you've learned.</p>
            </div>

            <StudySession />
        </motion.div>
    );
}
