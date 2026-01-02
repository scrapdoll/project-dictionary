'use client';

import { Globe } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Locale, locales } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const languageNames: Record<Locale, string> = {
  en: 'English',
  ru: 'Русский'
};

export function LanguageSelector() {
  const { locale, setLocale } = useLanguage();

  return (
    <div className="grid grid-cols-2 gap-2">
      {locales.map((loc) => (
        <button
          key={loc}
          onClick={() => setLocale(loc)}
          className={cn(
            "p-3 rounded-lg font-bold text-sm transition-all border-2 flex items-center justify-center gap-2",
            locale === loc
              ? "bg-blue-600 border-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)]"
              : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700 hover:border-zinc-600"
          )}
        >
          <Globe size={16} />
          <span>{languageNames[loc]}</span>
        </button>
      ))}
    </div>
  );
}
