export default function Loading() {
  return (
    <div className="p-6 md:p-8 animate-pulse">
      <div className="mx-auto max-w-5xl">
        {/* Back link skeleton */}
        <div className="h-4 w-40 bg-muted rounded mb-6" />

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Header card */}
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-muted shrink-0" />
                <div className="flex-1">
                  <div className="h-6 w-64 bg-muted rounded mb-2" />
                  <div className="h-4 w-32 bg-muted rounded mb-3" />
                  <div className="flex gap-2">
                    <div className="h-6 w-20 bg-muted rounded-lg" />
                    <div className="h-6 w-20 bg-muted rounded-lg" />
                    <div className="h-6 w-16 bg-muted rounded-lg" />
                  </div>
                  <div className="h-4 w-28 bg-muted rounded mt-3" />
                </div>
              </div>
              <div className="mt-5 pt-5 border-t border-border">
                <div className="h-10 w-32 bg-muted rounded-lg" />
              </div>
            </div>

            {/* Description */}
            <div className="rounded-xl border border-border bg-card p-6 mt-4">
              <div className="h-5 w-36 bg-muted rounded mb-4" />
              <div className="space-y-2">
                <div className="h-3 w-full bg-muted rounded" />
                <div className="h-3 w-full bg-muted rounded" />
                <div className="h-3 w-5/6 bg-muted rounded" />
                <div className="h-3 w-full bg-muted rounded" />
                <div className="h-3 w-3/4 bg-muted rounded" />
                <div className="h-3 w-full bg-muted rounded" />
                <div className="h-3 w-2/3 bg-muted rounded" />
              </div>
            </div>
          </div>

          {/* Company sidebar */}
          <div className="w-full lg:w-80 shrink-0">
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-muted shrink-0" />
                <div>
                  <div className="h-4 w-28 bg-muted rounded mb-1" />
                  <div className="h-3 w-20 bg-muted rounded" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 w-full bg-muted rounded" />
                <div className="h-3 w-5/6 bg-muted rounded" />
                <div className="h-3 w-3/4 bg-muted rounded" />
              </div>
              <div className="space-y-2.5 mt-4">
                <div className="h-4 w-36 bg-muted rounded" />
                <div className="h-4 w-28 bg-muted rounded" />
                <div className="h-4 w-24 bg-muted rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
