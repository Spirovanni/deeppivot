"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "@/src/lib/toast";

interface JobDescription {
    id: number;
    title: string;
    company: string | null;
    status: string;
}

interface InterviewSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialJobDescriptionId?: number;
}

export function InterviewSettingsModal({
    isOpen,
    onClose,
    initialJobDescriptionId,
}: InterviewSettingsModalProps) {
    const [jobDescriptions, setJobDescriptions] = useState<JobDescription[]>([]);
    const [isLoadingJDs, setIsLoadingJDs] = useState(true);
    const [isStarting, setIsStarting] = useState(false);

    const [selectedJdId, setSelectedJdId] = useState<string>(
        initialJobDescriptionId ? initialJobDescriptionId.toString() : ""
    );
    const [sessionType, setSessionType] = useState<string>("general");

    const router = useRouter();

    // Fetch user's job descriptions when modal opens
    useEffect(() => {
        if (isOpen) {
            const fetchJDs = async () => {
                try {
                    setIsLoadingJDs(true);
                    const response = await fetch("/api/job-descriptions");
                    if (!response.ok) throw new Error("Failed to fetch job descriptions");
                    const data: JobDescription[] = await response.json();
                    setJobDescriptions(data.filter((jd) => jd.status === "extracted"));

                    if (!selectedJdId && data.length > 0) {
                        const extractedJds = data.filter((jd) => jd.status === "extracted");
                        if (extractedJds.length > 0) {
                            setSelectedJdId(extractedJds[0].id.toString());
                        }
                    }
                } catch (error) {
                    console.error("Error loading job descriptions:", error);
                    toast.error("Failed to load job descriptions. Please try again.");
                } finally {
                    setIsLoadingJDs(false);
                }
            };

            fetchJDs();
        }
    }, [isOpen]);

    // Update selected JD if the prop changes
    useEffect(() => {
        if (initialJobDescriptionId) {
            setSelectedJdId(initialJobDescriptionId.toString());
        }
    }, [initialJobDescriptionId]);

    const handleStartInterview = async () => {
        if (!selectedJdId) {
            toast.error("Please select a job description to practice for.");
            return;
        }

        try {
            setIsStarting(true);

            const response = await fetch("/api/interviews/context-aware/start", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    jobDescriptionId: parseInt(selectedJdId, 10),
                    sessionType,
                    // resumeId is optional and omitted for now until resume upload is built
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || errorData.error || "Failed to start interview");
            }

            const data = await response.json();

            // We got the temporary agent's signedUrl!
            toast.success("Your custom AI interviewer has been created. Connecting...");

            // Navigate to the interview room and pass the context data via query params
            // We pass the signedUrl to bypass the standard agent creation
            const searchParams = new URLSearchParams({
                jobDescriptionId: selectedJdId,
                sessionType: sessionType,
                signedUrl: data.signedUrl,
                agentId: data.agentId,
                sessionId: data.sessionId.toString()
            });

            onClose();
            router.push(`/dashboard/interviews/session?${searchParams.toString()}`);

        } catch (error) {
            console.error("Error starting context-aware interview:", error);
            toast.error(error instanceof Error ? error.message : "An unexpected error occurred");
        } finally {
            setIsStarting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Practice for a Specific Job</DialogTitle>
                    <DialogDescription>
                        Configure your AI interviewer context. Sarah will act as a recruiter
                        hiring for this exact role.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="job-description">Target Job Description</Label>
                        {isLoadingJDs ? (
                            <div className="flex items-center text-sm text-slate-500">
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Loading your saved jobs...
                            </div>
                        ) : jobDescriptions.length === 0 ? (
                            <div className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 p-3 rounded-md border border-amber-200 dark:border-amber-900">
                                You do not have any extracted job descriptions. Please visit the Job descriptions library to add one before practicing.
                            </div>
                        ) : (
                            <Select value={selectedJdId} onValueChange={setSelectedJdId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a job description" />
                                </SelectTrigger>
                                <SelectContent>
                                    {jobDescriptions.map((jd) => (
                                        <SelectItem key={jd.id} value={jd.id.toString()}>
                                            {jd.title} {jd.company ? `at ${jd.company}` : ""}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="session-type">Interview Focus</Label>
                        <Select value={sessionType} onValueChange={setSessionType}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select interview type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="general">General (Balanced)</SelectItem>
                                <SelectItem value="behavioral">Behavioral (STAR Method)</SelectItem>
                                <SelectItem value="technical">Technical (Skills & Tools)</SelectItem>
                                <SelectItem value="situational">Situational (Scenario-based)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isStarting}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleStartInterview}
                        disabled={isStarting || jobDescriptions.length === 0 || !selectedJdId}
                    >
                        {isStarting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Start Interview
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
