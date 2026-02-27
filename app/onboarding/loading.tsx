export default function OnboardingLoading() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 py-12">
            <div className="w-full max-w-4xl">
                {/* Header skeleton */}
                <div className="mb-10 flex flex-col items-center gap-4">
                    <div className="h-5 w-28 animate-pulse rounded-full bg-slate-800" />
                    <div className="h-10 w-72 animate-pulse rounded-xl bg-slate-800" />
                    <div className="h-5 w-80 animate-pulse rounded-full bg-slate-800" />
                </div>

                {/* Card skeletons */}
                <div className="mb-8 grid gap-5 sm:grid-cols-2">
                    {[0, 1].map((i) => (
                        <div
                            key={i}
                            className="rounded-2xl border-2 border-slate-800 bg-slate-900/80 p-7"
                        >
                            <div className="mb-5 size-16 animate-pulse rounded-2xl bg-slate-800" />
                            <div className="mb-3 space-y-2">
                                <div className="h-7 w-36 animate-pulse rounded-lg bg-slate-800" />
                                <div className="h-4 w-28 animate-pulse rounded-full bg-slate-800" />
                            </div>
                            <div className="mb-5 space-y-1.5">
                                <div className="h-3.5 w-full animate-pulse rounded-full bg-slate-800" />
                                <div className="h-3.5 w-5/6 animate-pulse rounded-full bg-slate-800" />
                                <div className="h-3.5 w-4/6 animate-pulse rounded-full bg-slate-800" />
                            </div>
                            <div className="space-y-2">
                                {[0, 1, 2, 3, 4].map((j) => (
                                    <div
                                        key={j}
                                        className="h-4 animate-pulse rounded-full bg-slate-800"
                                        style={{ width: `${70 + (j % 3) * 10}%` }}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Button skeleton */}
                <div className="flex justify-center">
                    <div className="h-14 w-72 animate-pulse rounded-xl bg-slate-800" />
                </div>
            </div>
        </div>
    );
}
