'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { db } from '@/lib/db';
import { Locale, defaultLocale } from '@/lib/i18n';
import { loadMessages, I18nProvider } from '@/lib/i18n-client';

interface LanguageContextType {
    locale: Locale;
    setLocale: (locale: Locale) => Promise<void>;
    messages: any;
    isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [locale, setLocaleState] = useState<Locale>(defaultLocale);
    const [messages, setMessages] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadLanguage = async () => {
            try {
                const settings = await db.settings.get(1);
                const savedLocale = settings?.language?.split('-')[0] as Locale || defaultLocale;

                // Map full locale to our supported locales
                const mappedLocale = savedLocale === 'ru' ? 'ru' : 'en';

                setLocaleState(mappedLocale);
                const msgs = await loadMessages(mappedLocale);
                setMessages(msgs);
            } catch (error) {
                console.error('Failed to load language:', error);
                const msgs = await loadMessages(defaultLocale);
                setMessages(msgs);
            } finally {
                setIsLoading(false);
            }
        };

        loadLanguage();
    }, []);

    const setLocale = async (newLocale: Locale) => {
        setIsLoading(true);
        try {
            // Update IndexedDB
            const settings = await db.settings.get(1);
            if (settings) {
                await db.settings.update(1, {
                    language: newLocale === 'ru' ? 'ru-RU' : 'en-US'
                });
            }

            // Load new messages
            const msgs = await loadMessages(newLocale);
            setMessages(msgs);
            setLocaleState(newLocale);
        } catch (error) {
            console.error('Failed to change language:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading || !messages) {
        return null;
    }

    return (
        <LanguageContext.Provider value={{ locale, setLocale, messages, isLoading }}>
            <I18nProvider locale={locale} messages={messages}>
                {children}
            </I18nProvider>
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within LanguageProvider');
    }
    return context;
}
