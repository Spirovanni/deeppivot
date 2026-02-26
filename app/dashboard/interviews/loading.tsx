import { Skeleton } from "@/components/ui/skeleton";

function SessionCardSkeleton() {
    return (
        <div className="rounded-xl border bg-card p-4 flex items-center gap-4">
            <Skeleton className="size-10 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-48" />
                <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-7 w-20 rounded-lg" />
        </div>
    );
}

export default function InterviewsLoading() {
    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-9 w-36 rounded-lg" />
            </div>
            {/* Session list */}
            <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                    <SessionCardSkeleton key={i} />
                ))}
            </div>
        </div>
    );
}
