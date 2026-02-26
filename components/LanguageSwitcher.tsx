"use client";

import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { setUserLocale } from "@/services/locale";
import type { Locale } from "@/services/locale";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";

export function LanguageSwitcher() {
    const t = useTranslations("LanguageSwitcher");
    const locale = useLocale();
    const [isPending, startTransition] = useTransition();

    function onSelectChange(nextLocale: Locale) {
        startTransition(() => {
            setUserLocale(nextLocale);
        });
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" disabled={isPending}>
                    <Globe className="h-5 w-5" />
                    <span className="sr-only">{t("label")}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem
                    onClick={() => onSelectChange("en")}
                    className={locale === "en" ? "bg-accent" : ""}
                >
                    {t("en")}
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => onSelectChange("es")}
                    className={locale === "es" ? "bg-accent" : ""}
                >
                    {t("es")}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
