"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles, Copy, Check } from "lucide-react";
import toast from "react-hot-toast";

interface SimpleResume {
    id: number;
    title: string;
    status: string;
}

interface SimpleJD {
    id: number;
    title: string;
    company: string | null;
    status: string | null;
}

interface GenerateCoverLetterModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** Pre-selected job description id (from Kanban card's linked JD) */
    jobDescriptionId?: number | null;
    /** Pre-selected resume id */
    resumeId?: number | null;
    /** Link the generated cover letter to a job tracker card */
    jobApplicationId?: number | null;
    /** Called when generation completes with the full text and the DB cover letter id */
    onComplete?: (coverLetterId: number, content: string) => void;
}

export function GenerateCoverLetterModal({
    open,
    onOpenChange,
    jobDescriptionId: presetJdId,
    resumeId: presetResumeId,
    jobApplicationId,
    onComplete,
}: GenerateCoverLetterModalProps) {
    // Selection state
    const [jds, setJds] = useState<SimpleJD[]>([]);
    const [resumes, setResumes] = useState<SimpleResume[]>([]);
    const [selectedJdId, setSelectedJdId] = useState<string>("");
    const [selectedResumeId, setSelectedResumeId] = useState<string>("");
    const [tone, setTone] = useState<string>("professional");
    const [loadingOptions, setLoadingOptions] = useState(false);

    // Streaming state
    const [streaming, setStreaming] = useState(false);
    const [streamedText, setStreamedText] = useState("");
    const [done, setDone] = useState(false);
    const [copied, setCopied] = useState(false);
    const coverLetterIdRef = useRef<number | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const abortRef = useRef<AbortController | null>(null);

    // Fetch JDs and resumes when modal opens
    useEffect(() => {
        if (!open) return;

        setLoadingOptions(true);
        Promise.all([
            fetch("/api/job-descriptions").then((r) => r.json()),
            fetch("/api/resumes").then((r) => r.json()),
        ])
            .then(([jdData, resumeData]) => {
                const jdList: SimpleJD[] = (jdData.data ?? jdData ?? [])
                    .filter((j: SimpleJD) => j.status === "extracted");
                const resumeList: SimpleResume[] = (resumeData ?? [])
                    .filter((r: SimpleResume) => r.status === "extracted");

                setJds(jdList);
                setResumes(resumeList);

                // Pre-select
                if (presetJdId && jdList.some((j) => j.id === presetJdId)) {
                    setSelectedJdId(String(presetJdId));
                } else if (jdList.length === 1) {
                    setSelectedJdId(String(jdList[0].id));
                }

                if (presetResumeId && resumeList.some((r) => r.id === presetResumeId)) {
                    setSelectedResumeId(String(presetResumeId));
                } else if (resumeList.length === 1) {
                    setSelectedResumeId(String(resumeList[0].id));
                }
            })
            .catch(() => {
                toast.error("Failed to load job descriptions or resumes");
            })
            .finally(() => setLoadingOptions(false));
    }, [open, presetJdId, presetResumeId]);

    // Reset state when modal closes
    useEffect(() => {
        if (!open) {
            setStreamedText("");
            setDone(false);
            setCopied(false);
            setStreaming(false);
            coverLetterIdRef.current = null;
            abortRef.current?.abort();
        }
    }, [open]);

    // Auto-scroll as text streams in
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [streamedText]);

    const handleGenerate = useCallback(async () => {
        if (!selectedJdId) {
            toast.error("Please select a job description");
            return;
        }

        setStreaming(true);
        setStreamedText("");
        setDone(false);
        coverLetterIdRef.current = null;

        const controller = new AbortController();
        abortRef.current = controller;

        try {
            const payload: Record<string, unknown> = {
                jobDescriptionId: Number(selectedJdId),
                tone,
            };
            if (selectedResumeId) {
                payload.resumeId = Number(selectedResumeId);
            }
            if (jobApplicationId) {
                payload.jobApplicationId = jobApplicationId;
            }

            const response = await fetch("/api/cover-letters/generate/stream", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
                signal: controller.signal,
            });

            if (!response.ok) {
                const err = await response.json().catch(() => null);
                throw new Error(err?.error ?? `Request failed (${response.status})`);
            }

            const clId = response.headers.get("X-Cover-Letter-Id");
            if (clId) coverLetterIdRef.current = Number(clId);

            const reader = response.body?.getReader();
            if (!reader) throw new Error("No response body");

            const decoder = new TextDecoder();
            let fullText = "";

            while (true) {
                const { done: readerDone, value } = await reader.read();
                if (readerDone) break;
                const chunk = decoder.decode(value, { stream: true });
                fullText += chunk;
                setStreamedText(fullText);
            }

            setDone(true);
            if (coverLetterIdRef.current && onComplete) {
                onComplete(coverLetterIdRef.current, fullText);
            }
        } catch (error: unknown) {
            if (error instanceof DOMException && error.name === "AbortError") return;
            const msg = error instanceof Error ? error.message : "Generation failed";
            toast.error(msg);
        } finally {
            setStreaming(false);
        }
    }, [selectedJdId, selectedResumeId, tone, jobApplicationId, onComplete]);

    const handleCopy = useCallback(() => {
        navigator.clipboard.writeText(streamedText).then(() => {
            setCopied(true);
            toast.success("Copied to clipboard");
            setTimeout(() => setCopied(false), 2000);
        });
    }, [streamedText]);

    const showForm = !streaming && !done;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="size-5 text-brand-600" aria-hidden />
                        Generate Cover Letter
                    </DialogTitle>
                    <DialogDescription>
                        AI-powered cover letter tailored to the job description
                    </DialogDescription>
                </DialogHeader>

                {/* Selection Form */}
                {showForm && (
                    <div className="space-y-4 py-2">
                        {loadingOptions ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="size-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="jd-select">Job Description *</Label>
                                    <Select
                                        value={selectedJdId}
                                        onValueChange={setSelectedJdId}
                                    >
                                        <SelectTrigger id="jd-select">
                                            <SelectValue placeholder="Select a job description" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {jds.map((jd) => (
                                                <SelectItem
                                                    key={jd.id}
                                                    value={String(jd.id)}
                                                >
                                                    {jd.title}
                                                    {jd.company && ` — ${jd.company}`}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {jds.length === 0 && (
                                        <p className="text-xs text-muted-foreground">
                                            No extracted job descriptions found. Upload one in the JD Library first.
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="resume-select">
                                        Resume{" "}
                                        <span className="text-muted-foreground font-normal">(optional)</span>
                                    </Label>
                                    <Select
                                        value={selectedResumeId}
                                        onValueChange={setSelectedResumeId}
                                    >
                                        <SelectTrigger id="resume-select">
                                            <SelectValue placeholder="Select a resume for better results" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {resumes.map((r) => (
                                                <SelectItem
                                                    key={r.id}
                                                    value={String(r.id)}
                                                >
                                                    {r.title}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="tone-select">Tone</Label>
                                    <Select value={tone} onValueChange={setTone}>
                                        <SelectTrigger id="tone-select">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="professional">
                                                Professional
                                            </SelectItem>
                                            <SelectItem value="conversational">
                                                Conversational
                                            </SelectItem>
                                            <SelectItem value="enthusiastic">
                                                Enthusiastic
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <Button
                                    className="w-full bg-brand-600 hover:bg-brand-700"
                                    disabled={!selectedJdId}
                                    onClick={handleGenerate}
                                >
                                    <Sparkles className="size-4 mr-2" />
                                    Generate Cover Letter
                                </Button>
                            </>
                        )}
                    </div>
                )}

                {/* Streaming / Done View */}
                {(streaming || done) && (
                    <div className="flex-1 min-h-0 space-y-3">
                        <ScrollArea className="h-[50vh] pr-4" ref={scrollRef}>
                            <div className="prose prose-sm dark:prose-invert max-w-none">
                                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                                    {streamedText}
                                    {streaming && (
                                        <span className="inline-block w-2 h-4 ml-0.5 bg-brand-600 animate-pulse rounded-sm" />
                                    )}
                                </p>
                            </div>
                        </ScrollArea>

                        <div className="flex items-center gap-2 pt-2 border-t">
                            {streaming && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Loader2 className="size-4 animate-spin" />
                                    Generating...
                                </div>
                            )}

                            {done && (
                                <>
                                    <p className="text-sm text-green-600 font-medium">
                                        Generation complete
                                    </p>
                                    <div className="ml-auto flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleCopy}
                                        >
                                            {copied ? (
                                                <Check className="size-4 mr-1" />
                                            ) : (
                                                <Copy className="size-4 mr-1" />
                                            )}
                                            {copied ? "Copied" : "Copy"}
                                        </Button>
                                        <Button
                                            size="sm"
                                            onClick={() => onOpenChange(false)}
                                        >
                                            Done
                                        </Button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
