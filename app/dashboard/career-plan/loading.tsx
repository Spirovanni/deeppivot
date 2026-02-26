import { Skeleton } from "@/components/ui/skeleton";

function MilestoneSkeleton() {
    return (
        <div className="rounded-xl border bg-card p-4 flex items-start gap-4">
            <Skeleton className="size-5 rounded-full mt-0.5 shrink-0" />
            <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/5" />
                <div className="flex gap-2 pt-1">
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-5 w-20 rounded-full" />
                </div>
            </div>
        </div>
    );
}

export default function CareerPlanLoading() {
    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-9 w-32 rounded-lg" />
            </div>
            {/* Progress bar */}
            <div className="rounded-xl border bg-card p-4 space-y-2">
                <div className="flex justify-between">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-3 w-12" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
            </div>
            {/* Milestone list */}
            <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                    <MilestoneSkeleton key={i} />
                ))}
            </div>
        </div>
    );
}
