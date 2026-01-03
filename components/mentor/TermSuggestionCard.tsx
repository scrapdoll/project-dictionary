'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookPlus, X, Check } from 'lucide-react';

interface TermSuggestionCardProps {
    term: string;
    definition?: string;
    context?: string;
    onAdd: (term: string, definition: string, context?: string) => Promise<boolean>;
    onDismiss: () => void;
}

export function TermSuggestionCard({ term, definition, context, onAdd, onDismiss }: TermSuggestionCardProps) {
    const [isAdding, setIsAdding] = useState(false);
    const [added, setAdded] = useState(false);
    const [editing, setEditing] = useState(!definition);
    const [termInput, setTermInput] = useState(term);
    const [definitionInput, setDefinitionInput] = useState(definition || '');
    const [contextInput, setContextInput] = useState(context || '');

    const handleAdd = async () => {
        setIsAdding(true);
        const success = await onAdd(termInput, definitionInput, contextInput || undefined);
        if (success) {
            setAdded(true);
            setTimeout(() => {
                onDismiss();
            }, 1500);
        }
        setIsAdding(false);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="glass-card p-4 border border-green-500/20"
        >
            <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center text-green-400 flex-shrink-0">
                    <BookPlus size={20} />
                </div>

                <div className="flex-1 min-w-0">
                    {!added ? (
                        <>
                            <div className="flex items-start justify-between gap-2 mb-2">
                                <h4 className="font-semibold text-green-400">
                                    Add to Dictionary?
                                </h4>
                                <button
                                    onClick={onDismiss}
                                    className="text-zinc-500 hover:text-zinc-300 transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            {editing ? (
                                <div className="space-y-2">
                                    <input
                                        type="text"
                                        value={termInput}
                                        onChange={(e) => setTermInput(e.target.value)}
                                        placeholder="Term"
                                        className="glass-input text-sm"
                                    />
                                    <textarea
                                        value={definitionInput}
                                        onChange={(e) => setDefinitionInput(e.target.value)}
                                        placeholder="Definition"
                                        className="glass-input text-sm min-h-[60px] resize-none"
                                    />
                                    <textarea
                                        value={contextInput}
                                        onChange={(e) => setContextInput(e.target.value)}
                                        placeholder="Example or context (optional)"
                                        className="glass-input text-sm min-h-[40px] resize-none"
                                    />
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    <p className="font-medium">{term}</p>
                                    <p className="text-sm text-zinc-400">{definition}</p>
                                    {context && (
                                        <p className="text-xs text-zinc-500 italic">{context}</p>
                                    )}
                                </div>
                            )}

                            <div className="flex gap-2 mt-3">
                                {editing && (
                                    <button
                                        onClick={() => setEditing(false)}
                                        className="px-3 py-2 rounded-lg bg-zinc-700 text-zinc-300 text-sm font-medium hover:bg-zinc-600 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                )}
                                <button
                                    onClick={() => (editing ? handleAdd() : setEditing(true))}
                                    disabled={isAdding || (editing && (!termInput.trim() || !definitionInput.trim()))}
                                    className="flex-1 px-3 py-2 rounded-lg bg-green-500 text-white text-sm font-bold hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                                >
                                    {isAdding ? (
                                        <>
                                            <motion.div
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                            >
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                                            </motion.div>
                                            Adding...
                                        </>
                                    ) : editing ? (
                                        'Add Term'
                                    ) : (
                                        <>
                                            Edit & Add
                                        </>
                                    )}
                                </button>
                            </div>
                        </>
                    ) : (
                        <motion.div
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            className="flex items-center gap-2 text-green-400"
                        >
                            <Check size={20} />
                            <span className="font-medium">Added to dictionary!</span>
                        </motion.div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
