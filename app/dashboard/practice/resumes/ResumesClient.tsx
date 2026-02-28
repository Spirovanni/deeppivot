"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    FileText,
    Plus,
    Trash2,
    MoreVertical,
    ExternalLink,
    CheckCircle2,
    AlertCircle,
    Clock,
    Star,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

import { AddResumeModal, type ResumeItem } from "@/components/resumes/AddResumeModal";

interface ResumesClientProps {
    initialResumes: ResumeItem[];
}

export function ResumesClient({ initialResumes }: ResumesClientProps) {
    const [resumes, setResumes] = useState<ResumeItem[]>(initialResumes);
    const [isDeleting, setIsDeleting] = useState<number | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editResume, setEditResume] = useState<ResumeItem | null>(null);
    const [editTitle, setEditTitle] = useState("");
    const router = useRouter();

    const handleDelete = async (id: number) => {
        if (!confirm("Delete this resume? This cannot be undone.")) return;
        setIsDeleting(id);
        try {
            const res = await fetch(`/api/resumes/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete");
            setResumes((prev) => prev.filter((r) => r.id !== id));
            toast.success("Resume deleted");
            router.refresh();
        } catch {
            toast.error("Could not delete resume");
        } finally {
            setIsDeleting(null);
        }
    };

    const handleSetDefault = async (id: number) => {
        try {
            const res = await fetch(`/api/resumes/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isDefault: true }),
            });
            if (!res.ok) throw new Error("Failed to set default");
            setResumes((prev) =>
                prev.map((r) => ({ ...r, isDefault: r.id === id }))
            );
            router.refresh();
            toast.success("Default resume updated");
            router.refresh();
        } catch {
            toast.error("Could not set default resume");
        }
    };

    const handleSaveEdit = async () => {
        if (!editResume || !editTitle.trim()) return;
        try {
            const res = await fetch(`/api/resumes/${editResume.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: editTitle.trim() }),
            });
            if (!res.ok) throw new Error("Failed to update");
            setResumes((prev) =>
                prev.map((r) =>
                    r.id === editResume.id ? { ...r, title: editTitle.trim() } : r
                )
            );
            toast.success("Resume title updated");
            setEditResume(null);
            router.refresh();
        } catch {
            toast.error("Could not update resume");
        }
    };

    const StatusBadge = ({ status }: { status: string }) => {
        switch (status) {
            case "extracted":
                return (
                    <Badge variant="secondary" className="bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/20">
                        <CheckCircle2 className="mr-1 size-3" /> Ready
                    </Badge>
                );
            case "failed":
                return (
                    <Badge variant="destructive" className="bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/20">
                        <AlertCircle className="mr-1 size-3" /> Error
                    </Badge>
                );
            default:
                return (
                    <Badge variant="secondary" className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/20">
                        <Clock className="mr-1 size-3" /> Parsing
                    </Badge>
                );
        }
    };

    if (resumes.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 p-12 text-center">
                <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-primary/10">
                    <FileText className="size-8 text-primary" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">No Resumes Yet</h3>
                <p className="mb-6 max-w-md text-muted-foreground">
                    Upload a PDF or paste your resume to use it for cover letters and context-aware interview practice.
                </p>
                <Button onClick={() => setIsModalOpen(true)}>
                    <Plus className="mr-2 size-4" />
                    Add Resume
                </Button>
                <AddResumeModal
                    open={isModalOpen}
                    onOpenChange={setIsModalOpen}
                    onSuccess={(r) => setResumes((prev) => [r, ...prev])}
                />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <AddResumeModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                onSuccess={(r) => setResumes((prev) => [r, ...prev])}
            />

            <Dialog open={!!editResume} onOpenChange={(open) => !open && setEditResume(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Resume Title</DialogTitle>
                        <DialogDescription>Update the display name for this resume.</DialogDescription>
                    </DialogHeader>
                    {editResume && (
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="edit-title">Title</Label>
                                <Input
                                    id="edit-title"
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleSaveEdit()}
                                />
                            </div>
                            <Button onClick={handleSaveEdit}>Save</Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <div className="flex justify-end">
                <Button onClick={() => setIsModalOpen(true)}>
                    <Plus className="mr-2 size-4" />
                    Add Resume
                </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {resumes.map((resume) => (
                    <Card key={resume.id} className="flex flex-col transition-shadow hover:shadow-md">
                        <CardHeader className="pb-2">
                            <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h3 className="truncate font-semibold">{resume.title}</h3>
                                        {resume.isDefault && (
                                            <Star className="size-4 shrink-0 fill-amber-500 text-amber-500" />
                                        )}
                                    </div>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                                            <MoreVertical className="size-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem
                                            onClick={() => {
                                                setEditResume(resume);
                                                setEditTitle(resume.title);
                                            }}
                                        >
                                            Edit title
                                        </DropdownMenuItem>
                                        {!resume.isDefault && (
                                            <DropdownMenuItem onClick={() => handleSetDefault(resume.id)}>
                                                Set as default
                                            </DropdownMenuItem>
                                        )}
                                        <DropdownMenuItem
                                            className="text-destructive focus:text-destructive"
                                            onClick={() => handleDelete(resume.id)}
                                            disabled={isDeleting === resume.id}
                                        >
                                            <Trash2 className="mr-2 size-4" />
                                            Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                            <StatusBadge status={resume.status} />
                        </CardHeader>
                        <CardContent className="flex-1 pb-2">
                            <p className="text-xs text-muted-foreground">
                                Added {formatDistanceToNow(new Date(resume.createdAt), { addSuffix: true })}
                            </p>
                        </CardContent>
                        <CardFooter className="pt-2">
                            {resume.fileUrl && (
                                <a
                                    href={resume.fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 text-sm text-primary hover:underline"
                                >
                                    <ExternalLink className="size-4" />
                                    View PDF
                                </a>
                            )}
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
}
