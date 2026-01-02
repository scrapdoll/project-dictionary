'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { BookOpen, PlusCircle, Settings, LayoutDashboard, Library } from 'lucide-react';
import { motion } from 'framer-motion';
import { useT } from '@/lib/useTranslations';

export default function NavBar() {
    const pathname = usePathname();
    const t = useT('nav');

    const navItems = [
        { href: '/', label: t('dashboard'), icon: LayoutDashboard },
        { href: '/study', label: t('study'), icon: BookOpen },
        { href: '/library', label: t('library'), icon: Library },
        { href: '/add', label: t('addTerm'), icon: PlusCircle },
        { href: '/settings', label: t('settings'), icon: Settings },
    ];

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 w-full max-w-lg md:top-6 md:bottom-auto">
            <nav className="glass-card bg-black/40 backdrop-blur-2xl px-2 py-2 md:px-6">
                <div className="flex items-center justify-around md:justify-between h-12">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "relative flex flex-col items-center justify-center px-4 py-1 rounded-xl transition-all duration-300 group",
                                    isActive ? "text-blue-400 bg-white/5" : "text-zinc-500 hover:text-zinc-200"
                                )}
                            >
                                <div className="flex flex-col items-center gap-1">
                                    <Icon size={20} className={cn("transition-transform duration-300", isActive && "scale-110")} />
                                    <span className="text-[10px] font-medium md:text-xs">
                                        {item.label}
                                    </span>
                                </div>

                                {isActive && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute -bottom-1 w-1 h-1 bg-blue-400 rounded-full"
                                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                                    />
                                )}
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </div>
    );
}
