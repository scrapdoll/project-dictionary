'use client';

import { NextIntlClientProvider } from 'next-intl';
import { type ReactNode } from 'react';
import type { Locale } from './i18n';

interface I18nProviderProps {
    locale: Locale;
    messages: any;
    children: ReactNode;
}

export function I18nProvider({ locale, messages, children }: I18nProviderProps) {
    return (
        <NextIntlClientProvider locale={locale} messages={messages}>
            {children}
        </NextIntlClientProvider>
    );
}

export async function loadMessages(locale: Locale) {
    const messages = await import(`@/locales/${locale}/common.json`);
    return messages.default;
}
