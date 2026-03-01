import { Bell } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function NotificationsLoading() {
    return (
        <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Bell className="size-6 text-muted-foreground" />
                <div className="space-y-1">
                    <Skeleton className="h-5 w-32 rounded" />
                    <Skeleton className="h-3.5 w-20 rounded" />
                </div>
            </div>

            {/* Skeleton notification cards */}
            <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div
                        key={i}
                        className="flex gap-4 rounded-xl border border-border p-4"
                    >
                        <Skeleton className="size-9 shrink-0 rounded-full" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-2/3 rounded" />
                            <Skeleton className="h-3.5 w-full rounded" />
                            <Skeleton className="h-3.5 w-4/5 rounded" />
                            <div className="flex items-center gap-2 pt-0.5">
                                <Skeleton className="h-4 w-16 rounded-full" />
                                <Skeleton className="h-3 w-12 rounded" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
