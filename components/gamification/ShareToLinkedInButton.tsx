"use client";

import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://deeppivot.com";

/**
 * Share achievement/achievements to LinkedIn.
 * Opens the LinkedIn share dialog with the app URL.
 * Phase 16.4 (deeppivot-285)
 */
export function ShareToLinkedInButton({
    variant = "outline",
    size = "sm",
}: {
    variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
    size?: "default" | "sm" | "lg" | "icon";
}) {
    const handleShare = () => {
        const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
            `${BASE_URL}/dashboard/achievements`
        )}`;
        window.open(
            shareUrl,
            "linkedin-share",
            "width=600,height=600,noopener,noreferrer"
        );
    };

    return (
        <Button
            variant={variant}
            size={size}
            onClick={handleShare}
            className="gap-2"
        >
            <Share2 className="size-4" />
            Share to LinkedIn
        </Button>
    );
}
