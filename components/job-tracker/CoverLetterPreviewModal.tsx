"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Loader2 } from "lucide-react";
import { getCoverLetterForJobApplication } from "@/src/lib/actions/cover-letter-preview";
import type { JobApplication } from "./types";

interface CoverLetterPreviewModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    job: JobApplication | null;
}

export function CoverLetterPreviewModal({
    open,
    onOpenChange,
    job,
}: CoverLetterPreviewModalProps) {
    const [content, setContent] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!open || !job) {
            setContent(null);
            setError(null);
            return;
        }
        let cancelled = false;
        setLoading(true);
        setError(null);
        getCoverLetterForJobApplication(job.id)
            .then(({ content: c }) => {
                if (!cancelled) setContent(c);
            })
            .catch(() => {
                if (!cancelled) setError("Failed to load cover letter");
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [open, job?.id]);

    const jobLabel = job ? `${job.position} at ${job.company}` : "";

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileText className="size-5" aria-hidden />
                        Cover Letter
                    </DialogTitle>
                    <DialogDescription>
                        {jobLabel && (
                            <span className="text-foreground/80">{jobLabel}</span>
                        )}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 min-h-0">
                    {loading && (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="size-8 animate-spin text-muted-foreground" />
                        </div>
                    )}

                    {!loading && error && (
                        <p className="text-sm text-destructive py-4">{error}</p>
                    )}

                    {!loading && !error && content && (
                        <ScrollArea className="h-[50vh] pr-4">
                            <div className="prose prose-sm dark:prose-invert max-w-none">
                                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                                    {content}
                                </p>
                            </div>
                        </ScrollArea>
                    )}

                    {!loading && !error && !content && (
                        <p className="text-sm text-muted-foreground py-6">
                            No cover letter found for this application. Add one when applying
                            through the marketplace, or generate one from the Job Description
                            Library for a matching role.
                        </p>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
