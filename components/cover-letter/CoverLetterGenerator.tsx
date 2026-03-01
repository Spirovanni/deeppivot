"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Sparkles, Loader2, FileText, History as HistoryIcon, Clock } from "lucide-react";
import toast from "react-hot-toast";
import { CoverLetterEditor } from "./CoverLetterEditor";
import { formatDistanceToNow } from "date-fns";

interface Resume {
    id: number;
    title: string;
    status: string;
}

interface JobDescription {
    id: number;
    title: string;
    company: string | null;
}

interface CoverLetterHistory {
    id: number;
    content: string;
    tone: string;
    createdAt: Date;
    jobTitle: string;
}

interface CoverLetterGeneratorProps {
    resumes: Resume[];
    jobDescriptions: JobDescription[];
    history: CoverLetterHistory[];
}

export function CoverLetterGenerator({ resumes, jobDescriptions, history }: CoverLetterGeneratorProps) {
    const [selectedResume, setSelectedResume] = useState<string>(
        resumes.find(r => r.status === 'extracted')?.id.toString() || ""
    );
    const [selectedJob, setSelectedJob] = useState<string>("");
    const [tone, setTone] = useState<string>("professional");
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedContent, setGeneratedContent] = useState("");
    const [coverLetterId, setCoverLetterId] = useState<number | null>(null);

    const handleGenerate = async () => {
        if (!selectedJob) {
            toast.error("Please select a job description");
            return;
        }

        setIsGenerating(true);
        setGeneratedContent("");
        setCoverLetterId(null);

        try {
            const response = await fetch("/api/cover-letters/generate/stream", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    jobDescriptionId: parseInt(selectedJob),
                    resumeId: selectedResume ? parseInt(selectedResume) : undefined,
                    tone,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to generate cover letter");
            }

            const clId = response.headers.get("X-Cover-Letter-Id");
            if (clId) setCoverLetterId(parseInt(clId));

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            if (!reader) throw new Error("Failed to start stream");

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value, { stream: true });
                setGeneratedContent((prev) => prev + chunk);
            }

            toast.success("Cover letter generated!");
        } catch (error) {
            console.error("Generation error:", error);
            toast.error(error instanceof Error ? error.message : "Failed to generate");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSelectHistory = (item: CoverLetterHistory) => {
        setGeneratedContent(item.content);
        setCoverLetterId(item.id);
        toast.success(`Loaded cover letter for ${item.jobTitle}`);
    };

    return (
        <div className="grid gap-8 lg:grid-cols-2">
            <div className="space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Configuration</CardTitle>
                        <CardDescription>
                            Choose the source data for your cover letter.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="resume">Resume</Label>
                            <Select value={selectedResume} onValueChange={setSelectedResume}>
                                <SelectTrigger id="resume">
                                    <SelectValue placeholder="Select a resume" />
                                </SelectTrigger>
                                <SelectContent>
                                    {resumes.map((r) => (
                                        <SelectItem
                                            key={r.id}
                                            value={r.id.toString()}
                                            disabled={r.status !== 'extracted'}
                                        >
                                            {r.title} {r.status !== 'extracted' && "(Not yet parsed)"}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="job">Job Description</Label>
                            <Select value={selectedJob} onValueChange={setSelectedJob}>
                                <SelectTrigger id="job">
                                    <SelectValue placeholder="Select a job" />
                                </SelectTrigger>
                                <SelectContent>
                                    {jobDescriptions.map((j) => (
                                        <SelectItem key={j.id} value={j.id.toString()}>
                                            {j.title} {j.company ? `at ${j.company}` : ""}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="tone">Tone</Label>
                            <Select value={tone} onValueChange={setTone}>
                                <SelectTrigger id="tone">
                                    <SelectValue placeholder="Select a tone" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="professional">Professional</SelectItem>
                                    <SelectItem value="conversational">Conversational</SelectItem>
                                    <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                                    <SelectItem value="creative">Creative</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <Button
                            className="w-full"
                            onClick={handleGenerate}
                            disabled={isGenerating || !selectedJob}
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="mr-2 h-4 w-4" />
                                    Generate Cover Letter
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>

                {history.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-md">
                                <HistoryIcon className="size-4" />
                                Recent Cover Letters
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y overflow-hidden rounded-md border">
                                {history.map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => handleSelectHistory(item)}
                                        className="flex w-full flex-col items-start gap-1 p-3 text-left hover:bg-muted/50 transition-colors"
                                    >
                                        <div className="flex w-full items-center justify-between">
                                            <span className="font-medium text-sm line-clamp-1">{item.jobTitle}</span>
                                            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                                {item.tone}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                            <Clock className="size-3" />
                                            {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            <div className="space-y-8">
                {generatedContent || isGenerating ? (
                    <CoverLetterEditor
                        content={generatedContent}
                        onChange={setGeneratedContent}
                        isGenerating={isGenerating}
                        coverLetterId={coverLetterId}
                    />
                ) : (
                    <Card className="flex h-full flex-col items-center justify-center border-dashed p-12 text-center">
                        <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <FileText className="size-6" />
                        </div>
                        <h3 className="text-lg font-semibold">Ready to generate</h3>
                        <p className="max-w-xs text-sm text-muted-foreground">
                            Select your documents on the left and click generate, or pick a recent letter from the history below.
                        </p>
                    </Card>
                )}
            </div>
        </div>
    );
}
