"use client";

import { useState } from "react";
import { X, Megaphone } from "lucide-react";
import Link from "next/link";
import { dismissAnnouncement } from "@/src/lib/actions/announcements";

interface AnnouncementBannerProps {
    announcement: {
        id: number;
        title: string;
        body: string;
    };
    userId: number;
}

export function AnnouncementBanner({ announcement, userId }: AnnouncementBannerProps) {
    const [isVisible, setIsVisible] = useState(true);

    if (!isVisible) return null;

    const handleDismiss = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsVisible(false);
        await dismissAnnouncement(userId, announcement.id);
    };

    return (
        <div className="relative w-full z-40 overflow-hidden">
            <div className="bg-primary/95 text-primary-foreground backdrop-blur-md shadow-sm relative group">
                {/* Subtle background glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary-foreground/0 via-primary-foreground/5 to-primary-foreground/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />

                <div className="mx-auto max-w-7xl px-3 py-2 sm:px-6 lg:px-8">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-1 items-center gap-3">
                            <div className="flex rounded-lg bg-primary-foreground/10 p-2 animate-pulse-slow">
                                <Megaphone className="size-3.5 text-primary-foreground" aria-hidden="true" />
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2">
                                <p className="text-sm font-semibold tracking-wide">
                                    {announcement.title}
                                </p>
                                <p className="hidden md:inline text-xs opacity-80 font-medium">
                                    Latest system update available
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-3">
                            <Link
                                href={`/dashboard/announcements/${announcement.id}`}
                                className="flex items-center justify-center rounded-full bg-primary-foreground px-4 py-1 text-[10px] sm:text-xs font-bold text-primary shadow-lg shadow-black/10 hover:bg-white hover:scale-105 active:scale-95 transition-all duration-200"
                            >
                                READ MORE
                            </Link>

                            <button
                                type="button"
                                onClick={handleDismiss}
                                className="flex rounded-full p-1.5 text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/20 focus:outline-none transition-all duration-200"
                            >
                                <span className="sr-only">Dismiss</span>
                                <X className="size-3.5" aria-hidden="true" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(0.95); }
        }
        .animate-pulse-slow {
          animation: pulse-slow 3s infinite ease-in-out;
        }
      `}</style>
        </div>
    );
}
