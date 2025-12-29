'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { motion } from 'framer-motion';
import { Sparkles, Trophy, Target, Library } from 'lucide-react';
import { useIsMounted } from '@/hooks/useIsMounted';

export default function DashboardStats() {
    const isMounted = useIsMounted();
    const allProgress = useLiveQuery(() => db.progress.toArray());
    const [stats, setStats] = useState({
        total: 0,
        due: 0,
        learned: 0,
        mastered: 0,
        xp: 0,
        level: 1
    });

    const settings = useLiveQuery(() => db.settings.get(1));

    useEffect(() => {
        if (!allProgress) return;

        const now = Date.now();
        const total = allProgress.length;
        const due = allProgress.filter(p => p.nextReview <= now).length;
        const learned = allProgress.filter(p => p.repetition > 0).length;
        const mastered = allProgress.filter(p => p.repetition > 5 || p.interval > 21).length;

        const xp = settings?.xp || 0;
        const level = Math.floor(xp / 100) + 1;

        setStats({ total, due, learned, mastered, xp, level });
    }, [allProgress, settings]);

    const data = [
        { name: 'Due', value: stats.due, color: '#3b82f6' },
        { name: 'Learned', value: stats.learned, color: '#818cf8' },
        { name: 'Mastered', value: stats.mastered, color: '#a855f7' },
    ];

    if (!isMounted) return <div className="min-h-[300px]" />;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-6 flex flex-col min-h-[300px]"
            >
                <div className="flex items-center gap-2 mb-6 text-zinc-400">
                    <Target size={18} />
                    <span className="font-medium">Knowledge Overview</span>
                </div>
                <div className="flex-1 w-full min-h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data}>
                            <XAxis
                                dataKey="name"
                                stroke="#52525b"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                dy={10}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(9, 9, 11, 0.8)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '12px',
                                    backdropFilter: 'blur(8px)'
                                }}
                                itemStyle={{ color: '#fff' }}
                                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                            />
                            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 gap-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="glass-card p-6 border-l-4 border-l-blue-500 overflow-hidden relative group"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Trophy size={80} />
                    </div>
                    <div className="flex justify-between items-end mb-4">
                        <div className="space-y-1">
                            <p className="text-zinc-500 text-sm font-medium">Rank</p>
                            <p className="text-2xl font-bold">Level {stats.level}</p>
                        </div>
                        <div className="text-right">
                            <span className="text-xs text-zinc-500 font-mono">{stats.xp} / {(stats.level) * 100} XP</span>
                        </div>
                    </div>
                    <div className="h-2 bg-zinc-800/50 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(stats.xp % 100)}%` }}
                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500"
                        />
                    </div>
                </motion.div>

                <div className="grid grid-cols-2 gap-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="glass-card p-6 flex flex-col items-center justify-center gap-2 group cursor-default"
                    >
                        <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500 group-hover:scale-110 transition-transform">
                            <Sparkles size={24} />
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold">{stats.total}</p>
                            <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Total Terms</p>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="glass-card p-6 flex flex-col items-center justify-center gap-2 group cursor-default"
                    >
                        <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 group-hover:scale-110 transition-transform">
                            <Library size={24} />
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold">{stats.mastered}</p>
                            <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Mastered</p>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
