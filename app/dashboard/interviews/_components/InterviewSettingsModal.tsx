"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface InterviewSettingsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    jobDescriptions: { id: number; positionTitle: string | null; companyName: string | null }[];
    resumes: { id: number; title: string | null }[];
    defaultSessionType?: string;
    defaultJobQuery?: string;
}

const SESSION_TYPES = [
    { value: "behavioral", label: "Behavioral" },
    { value: "technical", label: "Technical" },
    { value: "situational", label: "Situational" },
    { value: "general", label: "General" },
];

export function InterviewSettingsModal({
    open,
    onOpenChange,
    jobDescriptions,
    resumes,
    defaultSessionType = "general",
    defaultJobQuery = "",
}: InterviewSettingsModalProps) {
    const router = useRouter();
    const [sessionType, setSessionType] = useState(defaultSessionType);
    const [targetJobId, setTargetJobId] = useState<string>("none");
    const [resumeId, setResumeId] = useState<string>("none");

    // Attempt to auto-select a matching job description based on the query passed from Job Tracker
    useEffect(() => {
        if (open && defaultJobQuery && jobDescriptions.length > 0) {
            const lowerQuery = defaultJobQuery.toLowerCase();
            const match = jobDescriptions.find(
                (jd) =>
                    (jd.positionTitle && jd.positionTitle.toLowerCase().includes(lowerQuery)) ||
                    (jd.companyName && jd.companyName.toLowerCase().includes(lowerQuery))
            );
            if (match) {
                setTargetJobId(match.id.toString());
            }
        }
    }, [open, defaultJobQuery, jobDescriptions]);

    useEffect(() => {
        if (open) {
            setSessionType(defaultSessionType);
        }
    }, [open, defaultSessionType]);

    const handleStart = () => {
        const params = new URLSearchParams();
        params.set("type", sessionType);
        if (targetJobId !== "none") params.set("targetJobId", targetJobId);
        if (resumeId !== "none") params.set("resumeId", resumeId);

        onOpenChange(false);
        router.push(`/dashboard/interviews/session?${params.toString()}`);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Interview Settings</DialogTitle>
                    <DialogDescription>
                        Customize your interview to get highly contextual practice and tailored questions from Sarah.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="session-type" className="text-right">
                            Type
                        </Label>
                        <div className="col-span-3">
                            <Select value={sessionType} onValueChange={setSessionType}>
                                <SelectTrigger id="session-type">
                                    <SelectValue placeholder="Select interview type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {SESSION_TYPES.map((type) => (
                                        <SelectItem key={type.value} value={type.value}>
                                            {type.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="target-job" className="text-right">
                            Target Job
                        </Label>
                        <div className="col-span-3">
                            <Select value={targetJobId} onValueChange={setTargetJobId}>
                                <SelectTrigger id="target-job">
                                    <SelectValue placeholder="Select a job description" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">None (General)</SelectItem>
                                    {jobDescriptions.map((jd) => (
                                        <SelectItem key={jd.id} value={jd.id.toString()}>
                                            {jd.positionTitle} {jd.companyName ? `at ${jd.companyName}` : ""}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="resume" className="text-right">
                            Your Resume
                        </Label>
                        <div className="col-span-3">
                            <Select value={resumeId} onValueChange={setResumeId}>
                                <SelectTrigger id="resume">
                                    <SelectValue placeholder="Select a resume" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">None (General)</SelectItem>
                                    {resumes.map((resume) => (
                                        <SelectItem key={resume.id} value={resume.id.toString()}>
                                            {resume.title || `Resume #${resume.id}`}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleStart}>Start Interview</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
