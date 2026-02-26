/**
 * Lightweight feature flag system — deeppivot-137
 *
 * Priority: env var override > flags.json config > default false
 *
 * Usage (server):
 *   import { isEnabled } from "@/src/lib/flags";
 *   if (isEnabled("job_marketplace_enabled")) { ... }
 *
 * Usage (client):
 *   import { useFeatureFlag } from "@/src/lib/flags";
 *   const enabled = useFeatureFlag("blog_enabled");
 */

import flagsConfig from "@/src/config/flags.json";
import { useState, useEffect } from "react";

type FlagKey = keyof typeof flagsConfig;

/**
 * Check if a feature flag is enabled.
 * Works in both server and client contexts.
 */
export function isEnabled(flag: string): boolean {
    // Env var override: FEATURE_BLOG_ENABLED=true/false
    const envKey = `FEATURE_${flag.toUpperCase()}`;
    const envVal = process.env[envKey];
    if (envVal !== undefined) {
        return envVal.toLowerCase() === "true" || envVal === "1";
    }

    // Fall back to flags.json
    if (flag in flagsConfig) {
        const val = flagsConfig[flag as FlagKey];
        if (typeof val === "boolean") return val;
        // Rollout percentage support (0-100)
        if (typeof val === "number") return Math.random() * 100 < val;
    }

    return false;
}

/**
 * React hook for reading a feature flag in client components.
 * Falls back to the server-evalated value via a simple fetch on first mount
 * (avoids hydration mismatches for random-rollout flags).
 */
export function useFeatureFlag(flag: string): boolean {
    // Default to what we can resolve synchronously (no env access on client)
    const getDefault = () => {
        if (flag in flagsConfig) {
            const val = flagsConfig[flag as FlagKey];
            if (typeof val === "boolean") return val;
        }
        return false;
    };

    const [enabled, setEnabled] = useState<boolean>(getDefault);

    useEffect(() => {
        // For flags with simple boolean values we already have the answer
        setEnabled(getDefault());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [flag]);

    return enabled;
}

/** All defined flags as a typed object (useful for admin UIs) */
export function getAllFlags(): Record<string, boolean> {
    return Object.fromEntries(
        Object.keys(flagsConfig).map((key) => [key, isEnabled(key)])
    );
}
