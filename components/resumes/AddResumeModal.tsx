"use client";

import { useState, useRef } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileUp, FileText, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export interface ResumeItem {
    id: number;
    title: string;
    fileUrl: string | null;
    status: string;
    isDefault: boolean;
    createdAt: string | Date;
}

interface AddResumeModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: (resume: ResumeItem) => void;
}

export function AddResumeModal({ open, onOpenChange, onSuccess }: AddResumeModalProps) {
    const [activeTab, setActiveTab] = useState<"paste" | "upload">("paste");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleReset = () => {
        setTitle("");
        setContent("");
        setSelectedFile(null);
        setActiveTab("paste");
    };

    const handlePasteSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !content.trim()) {
            toast.error("Title and content are required");
            return;
        }
        setIsSubmitting(true);
        try {
            const res = await fetch("/api/resumes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: title.trim(), content: content.trim() }),
            });
            if (!res.ok) throw new Error("Failed to add resume");
            const data = await res.json();
            toast.success("Resume added successfully");
            onSuccess({
                id: data.id,
                title: data.title ?? title,
                fileUrl: data.fileUrl ?? null,
                status: data.status ?? "pending",
                isDefault: data.isDefault ?? false,
                createdAt: data.createdAt ?? new Date(),
            });
            handleReset();
            onOpenChange(false);
        } catch {
            toast.error("Could not add resume");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUploadSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFile) {
            toast.error("Please select a PDF file");
            return;
        }
        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.set("file", selectedFile);
            if (title.trim()) formData.set("title", title.trim());
            const res = await fetch("/api/resumes/upload", {
                method: "POST",
                body: formData,
            });
            if (!res.ok) throw new Error("Failed to upload");
            const data = await res.json();
            toast.success("Resume uploaded successfully");
            onSuccess({
                id: data.id,
                title: data.title ?? (title.trim() || selectedFile.name.replace(/\.pdf$/i, "")),
                fileUrl: data.fileUrl ?? null,
                status: data.status ?? "pending",
                isDefault: data.isDefault ?? false,
                createdAt: data.createdAt ?? new Date(),
            });
            handleReset();
            onOpenChange(false);
        } catch {
            toast.error("Could not upload resume");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Add Resume</DialogTitle>
                    <DialogDescription>
                        Upload a PDF or paste your resume text. We&apos;ll extract key information for cover letters and interviews.
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "paste" | "upload")}>
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="paste">
                            <FileText className="mr-2 size-4" />
                            Paste Text
                        </TabsTrigger>
                        <TabsTrigger value="upload">
                            <FileUp className="mr-2 size-4" />
                            Upload PDF
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="paste" className="mt-4">
                        <form onSubmit={handlePasteSubmit} className="space-y-4">
                            <div>
                                <Label htmlFor="resume-title">Title</Label>
                                <Input
                                    id="resume-title"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g. Software Engineer Resume"
                                />
                            </div>
                            <div>
                                <Label htmlFor="resume-content">Resume content</Label>
                                <Textarea
                                    id="resume-content"
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder="Paste your resume text here..."
                                    rows={8}
                                    className="font-mono text-sm"
                                />
                            </div>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : "Add Resume"}
                            </Button>
                        </form>
                    </TabsContent>

                    <TabsContent value="upload" className="mt-4">
                        <form onSubmit={handleUploadSubmit} className="space-y-4">
                            <div>
                                <Label htmlFor="upload-title">Title (optional)</Label>
                                <Input
                                    id="upload-title"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Leave blank to use filename"
                                />
                            </div>
                            <div>
                                <Label>PDF file</Label>
                                <div className="mt-2 flex items-center gap-2">
                                    <Input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="application/pdf"
                                        className="hidden"
                                        onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        Choose PDF
                                    </Button>
                                    {selectedFile && (
                                        <span className="text-sm text-muted-foreground truncate max-w-[180px]">
                                            {selectedFile.name}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <Button type="submit" disabled={isSubmitting || !selectedFile}>
                                {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : "Upload"}
                            </Button>
                        </form>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
