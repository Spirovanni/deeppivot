"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { createJobApplication } from "@/src/lib/actions/job-applications";
import { getBoardWithColumns } from "@/src/lib/actions/job-board";
import { ensureUserInDb } from "@/src/lib/actions/ensure-user";
import type { JobDescription } from "./types";

interface AddToJobTrackerModalProps {
    job: JobDescription | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function AddToJobTrackerModal({
    job,
    open,
    onOpenChange,
    onSuccess,
}: AddToJobTrackerModalProps) {
    const [isPending, startTransition] = useTransition();
    const [columns, setColumns] = useState<{ id: number; name: string }[]>([]);
    const [selectedColumnId, setSelectedColumnId] = useState<number | null>(null);

    useEffect(() => {
        if (!open) return;
        let cancelled = false;
        (async () => {
            const userId = await ensureUserInDb();
            if (!userId || cancelled) return;
            const board = await getBoardWithColumns(userId);
            if (board?.columns && !cancelled) {
                setColumns(board.columns.map((c) => ({ id: c.id, name: c.name })));
                setSelectedColumnId(board.columns[0]?.id ?? null);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [open]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!job || !selectedColumnId) return;

        startTransition(async () => {
            const userId = await ensureUserInDb();
            if (!userId) return;

            await createJobApplication({
                company: job.company ?? "",
                position: job.title,
                columnId: selectedColumnId,
                userId,
                jobDescriptionId: job.id,
            });
            onSuccess();
            onOpenChange(false);
        });
    };

    if (!job) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle>Add to Job Tracker</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Add <strong>{job.title}</strong>
                        {job.company && <> at {job.company}</>} to your Kanban board.
                        Cover letters for this role will appear when you view the card.
                    </p>
                    <div>
                        <Label htmlFor="column">Column</Label>
                        <select
                            id="column"
                            value={selectedColumnId ?? ""}
                            onChange={(e) => setSelectedColumnId(parseInt(e.target.value, 10))}
                            className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm"
                        >
                            {columns.map((col) => (
                                <option key={col.id} value={col.id}>
                                    {col.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isPending || !selectedColumnId}>
                            {isPending ? "Adding…" : "Add to Tracker"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
