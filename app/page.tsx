'use client';

import DashboardStats from '@/components/DashboardStats';
import Link from 'next/link';
import { ChevronRight, Brain, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Home() {
  return (
    <div className="space-y-12 pb-12">
      <header className="relative py-12 text-center md:py-20 overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-from)_0%,_transparent_70%)] from-blue-500/10 opacity-50" />

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest mb-6"
        >
          <Zap size={12} className="fill-current" />
          AI-Powered SRS
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6"
        >
          Neuro<span className="text-glow">Lex</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-lg md:text-xl text-zinc-400 max-w-xl mx-auto leading-relaxed"
        >
          The ultimate dictionary for the modern learner.
          Stop forgetting and start <span className="text-zinc-200">mastering</span> with AI-driven spaced repetition.
        </motion.p>
      </header>

      <section className="space-y-6">
        <div className="flex items-center gap-2 px-1">
          <Brain size={20} className="text-indigo-400" />
          <h2 className="text-xl font-bold">Your Performance</h2>
        </div>
        <DashboardStats />
      </section>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex flex-col md:flex-row justify-center items-center gap-4 pt-4"
      >
        <Link
          href="/study"
          className="w-full md:w-auto px-8 py-4 rounded-2xl bg-white text-black font-bold flex items-center justify-center gap-2 hover:bg-zinc-200 transition-all active:scale-95 group shadow-[0_0_30px_rgba(255,255,255,0.15)]"
        >
          Start Session
          <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
        </Link>
        <Link
          href="/add"
          className="w-full md:w-auto px-8 py-4 rounded-2xl bg-zinc-800 text-white font-bold flex items-center justify-center gap-2 hover:bg-zinc-700 transition-all active:scale-95"
        >
          Enlarge Dictionary
        </Link>
      </motion.div>
    </div>
  );
}
