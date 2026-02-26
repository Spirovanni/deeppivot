import { getRequestConfig } from "next-intl/server";
import { getUserLocale } from "@/services/locale";

/**
 * This request configuration is required by next-intl to provide messages
 * and other configuration for the Server Components during the render cycle.
 * 
 * Since we are NOT using next-intl's i18n routing (no `[locale]` folder wrapper),
 * we must resolve the user's locale manually via a cookie/header.
 */
export default getRequestConfig(async () => {
    // Provide a static locale, fetch a user setting,
    // read from `cookies()`, `headers()`, etc.
    const locale = await getUserLocale();

    return {
        locale,
        // Provide the messages for the resolved locale
        messages: (await import(`../../messages/${locale}.json`)).default,
    };
});
