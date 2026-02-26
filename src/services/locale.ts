"use server";

import { cookies } from "next/headers";

// Define supported locales
export type Locale = "en" | "es";
const defaultLocale: Locale = "en";

// Key for the cookie that stores the user's preferred language
const LOCALE_COOKIE_NAME = "NEXT_LOCALE";

/**
 * Retrieves the preferred locale from the NEXT_LOCALE cookie.
 * Falls back to the defaultLocale if the cookie is not set.
 */
export async function getUserLocale(): Promise<Locale> {
    const cookieStore = await cookies();
    const localeCookie = cookieStore.get(LOCALE_COOKIE_NAME);

    // Validate that the cookie value is a supported locale
    if (localeCookie?.value === "en" || localeCookie?.value === "es") {
        return localeCookie.value as Locale;
    }

    return defaultLocale;
}

/**
 * Sets the NEXT_LOCALE cookie to persist the user's language preference.
 */
export async function setUserLocale(locale: Locale): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.set(LOCALE_COOKIE_NAME, locale, {
        path: "/",
        // Cookie expires in 1 year
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
    });
}
