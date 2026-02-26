import { Skeleton } from "@/components/ui/skeleton";

function KanbanColumnSkeleton() {
    return (
        <div className="rounded-xl border bg-muted/20 p-3 space-y-2 min-w-[220px]">
            <Skeleton className="h-4 w-28 mb-3" />
            {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-lg border bg-card p-3 space-y-2">
                    <Skeleton className="h-3 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <div className="flex gap-2 pt-1">
                        <Skeleton className="h-4 w-12 rounded-full" />
                        <Skeleton className="h-4 w-12 rounded-full" />
                    </div>
                </div>
            ))}
        </div>
    );
}

export default function JobTrackerLoading() {
    return (
        <div className="p-6">
            <Skeleton className="h-6 w-40 mb-6" />
            <div className="flex gap-4 overflow-x-auto pb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                    <KanbanColumnSkeleton key={i} />
                ))}
            </div>
        </div>
    );
}
