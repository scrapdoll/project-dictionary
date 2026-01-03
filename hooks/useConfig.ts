/**
 * React hook for accessing and updating application configuration
 * Provides reactivity when config changes
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { AppConfig, getConfig, updateConfig as updateConfigUtil, resetConfig as resetConfigUtil, CONFIG_STORAGE_KEY } from '@/lib/config';

/**
 * Hook for accessing and updating configuration
 * Automatically re-renders when configuration changes
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { config, updateConfig, resetConfig } = useConfig();
 *
 *   return (
 *     <div>
 *       <p>Model: {config.ai.defaultModel}</p>
 *       <button onClick={() => updateConfig({ ai: { defaultModel: 'gpt-4' } })}>
 *         Use GPT-4
 *       </button>
 *       <button onClick={resetConfig}>
 *         Reset to Defaults
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useConfig() {
    const [config, setConfig] = useState<AppConfig>(() => getConfig());

    useEffect(() => {
        // Listen for storage changes from other tabs/windows
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === CONFIG_STORAGE_KEY && e.newValue) {
                try {
                    setConfig(JSON.parse(e.newValue));
                } catch (error) {
                    console.error('Failed to parse config from storage:', error);
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const updateConfig = useCallback((updates: Partial<AppConfig>) => {
        updateConfigUtil(updates);
        setConfig(getConfig());
    }, []);

    const resetConfig = useCallback(() => {
        resetConfigUtil();
        setConfig(getConfig());
    }, []);

    return {
        config,
        updateConfig,
        resetConfig
    };
}
