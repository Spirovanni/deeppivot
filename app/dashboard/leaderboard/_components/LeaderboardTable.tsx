"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Sparkles, Flame } from "lucide-react";
import type { LeaderboardEntry } from "@/src/lib/actions/gamification";
import { cn } from "@/utils/index";

interface LeaderboardTableProps {
    data: LeaderboardEntry[];
    currentUserId: string | number;
}

export function LeaderboardTable({ data, currentUserId }: LeaderboardTableProps) {
    if (data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-muted-foreground">No one has opted in yet. Be the first!</p>
            </div>
        );
    }

    const currentUserIdStr = String(currentUserId);

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="w-[80px]">Rank</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead className="text-right">Points</TableHead>
                    <TableHead className="text-right">Streak</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {data.map((entry, index) => {
                    const isMe = String(entry.id) === currentUserIdStr;
                    const rank = index + 1;

                    return (
                        <TableRow key={entry.id} className={cn(isMe && "bg-primary/5 hover:bg-primary/10")}>
                            <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                    <span className={cn(
                                        "flex size-6 items-center justify-center rounded-full text-xs font-bold",
                                        rank === 1 ? "bg-amber-500 text-white" :
                                            rank === 2 ? "bg-slate-400 text-white" :
                                                rank === 3 ? "bg-orange-600 text-white" :
                                                    "text-muted-foreground"
                                    )}>
                                        {rank}
                                    </span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-3">
                                    {entry.avatarUrl ? (
                                        <img
                                            src={entry.avatarUrl}
                                            alt={entry.name}
                                            className="size-8 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="size-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                                            {entry.name?.[0] ?? "?"}
                                        </div>
                                    )}
                                    <span className={cn("truncate font-medium", isMe && "text-primary")}>
                                        {entry.name} {isMe && "(You)"}
                                    </span>
                                </div>
                            </TableCell>
                            <TableCell className="text-right">
                                <span className="inline-flex items-center gap-1 font-semibold">
                                    <Sparkles className="size-3 text-primary" />
                                    {entry.points.toLocaleString()}
                                </span>
                            </TableCell>
                            <TableCell className="text-right">
                                <span className="inline-flex items-center gap-1 font-semibold text-orange-500">
                                    <Flame className="size-3" />
                                    {entry.currentStreak}
                                </span>
                            </TableCell>
                        </TableRow>
                    );
                })}
            </TableBody>
        </Table>
    );
}
