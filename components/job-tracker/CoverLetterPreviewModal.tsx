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
import { Button } from "@/components/ui/button";
import { FileText, Loader2, Link2, Sparkles } from "lucide-react";
import {
    getCoverLetterForJobApplication,
    getLinkableCoverLettersForApplication,
    linkCoverLetterToJobApplication,
} from "@/src/lib/actions/cover-letter-preview";
import { GenerateCoverLetterModal } from "@/components/cover-letter/GenerateCoverLetterModal";
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
    const [linkableLetters, setLinkableLetters] = useState<{ id: number; positionTitle: string; companyName: string | null }[]>([]);
    const [linkingId, setLinkingId] = useState<number | null>(null);
    const [generateOpen, setGenerateOpen] = useState(false);

    const refresh = () => {
        if (!job) return;
        getCoverLetterForJobApplication(job.id).then(({ content: c }) => setContent(c));
    };

    useEffect(() => {
        if (!open || !job) {
            setContent(null);
            setError(null);
            setLinkableLetters([]);
            return;
        }
        let cancelled = false;
        setLoading(true);
        setError(null);
        Promise.all([
            getCoverLetterForJobApplication(job.id),
            getLinkableCoverLettersForApplication(job.id),
        ])
            .then(([{ content: c }, letters]) => {
                if (!cancelled) {
                    setContent(c);
                    setLinkableLetters(letters);
                }
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

    const handleLink = async (coverLetterId: number) => {
        if (!job) return;
        setLinkingId(coverLetterId);
        try {
            const result = await linkCoverLetterToJobApplication(job.id, coverLetterId);
            if (result.success) {
                refresh();
                setLinkableLetters((prev) => prev.filter((l) => l.id !== coverLetterId));
            } else if (result.error) {
                setError(result.error);
            }
        } finally {
            setLinkingId(null);
        }
    };

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
                        <div className="space-y-4 py-4">
                            <p className="text-sm text-muted-foreground">
                                No cover letter linked to this application. Generate one with AI, link an existing one below,
                                or add one when applying through the marketplace.
                            </p>

                            <Button
                                className="w-full bg-brand-600 hover:bg-brand-700"
                                onClick={() => setGenerateOpen(true)}
                            >
                                <Sparkles className="size-4 mr-2" />
                                Generate with AI
                            </Button>

                            <GenerateCoverLetterModal
                                open={generateOpen}
                                onOpenChange={setGenerateOpen}
                                jobApplicationId={job?.id}
                                onComplete={(_coverLetterId, generatedContent) => {
                                    setContent(generatedContent);
                                    setGenerateOpen(false);
                                }}
                            />

                            {linkableLetters.length > 0 && (
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground mb-2">Or link an existing cover letter:</p>
                                    <ul className="space-y-1.5">
                                        {linkableLetters.map((cl) => (
                                            <li
                                                key={cl.id}
                                                className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                                            >
                                                <span>
                                                    {cl.positionTitle}
                                                    {cl.companyName && (
                                                        <span className="text-muted-foreground"> @ {cl.companyName}</span>
                                                    )}
                                                </span>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    disabled={linkingId !== null}
                                                    onClick={() => handleLink(cl.id)}
                                                >
                                                    {linkingId === cl.id ? (
                                                        <Loader2 className="size-4 animate-spin" />
                                                    ) : (
                                                        <>
                                                            <Link2 className="size-4 mr-1" />
                                                            Link
                                                        </>
                                                    )}
                                                </Button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
