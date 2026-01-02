'use client';

import { useTranslations as useNextIntlTranslations } from 'next-intl';

export function useT(namespace: string) {
    return useNextIntlTranslations(namespace);
}
