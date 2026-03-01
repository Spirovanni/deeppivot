"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Plus, Trash2, Edit, Calendar, ExternalLink, CheckCircle2, AlertCircle, Clock, Briefcase } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { AddJobDescriptionModal } from "@/components/jobs/AddJobDescriptionModal";
import { EditJobDescriptionModal } from "@/components/jobs/EditJobDescriptionModal";
import { AddToJobTrackerModal } from "@/components/jobs/AddToJobTrackerModal";
import { JobDescription } from "@/components/jobs/types";

interface Props {
    initialJobs: JobDescription[];
}

export function JobDescriptionsClient({ initialJobs }: Props) {
    const [jobs, setJobs] = useState<JobDescription[]>(initialJobs);
    const [isDeleting, setIsDeleting] = useState<number | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingJob, setEditingJob] = useState<JobDescription | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const router = useRouter();

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this job description? This action cannot be undone.")) return;

        setIsDeleting(id);
        try {
            const res = await fetch(`/api/job-descriptions/${id}`, {
                method: "DELETE",
            });

            if (!res.ok) throw new Error("Failed to delete");

            setJobs((prev) => prev.filter((j) => j.id !== id));
            toast.success("Job description deleted");
            router.refresh(); // revalidate server cache
        } catch (error) {
            toast.error("Could not delete job description");
        } finally {
            setIsDeleting(null);
        }
    };

    const StatusIcon = ({ status }: { status: JobDescription["status"] }) => {
        switch (status) {
            case "extracted":
                return <Badge variant="secondary" className="bg-green-50 text-green-700 hover:bg-green-100 border-green-200"><CheckCircle2 className="w-3 h-3 mr-1" />Ready</Badge>;
            case "failed":
                return <Badge variant="destructive" className="bg-red-50 text-red-700 hover:bg-red-100 border-red-200"><AlertCircle className="w-3 h-3 mr-1" />Error</Badge>;
            case "pending":
            default:
                return <Badge variant="secondary" className="bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border-yellow-200"><Clock className="w-3 h-3 mr-1" />Parsing</Badge>;
        }
    };

    if (jobs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center bg-white border border-dashed border-gray-300 rounded-xl">
                <div className="w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center mb-4">
                    <FileText className="w-8 h-8 text-brand-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Job Descriptions Yet</h3>
                <p className="text-gray-500 max-w-md mb-6">
                    Upload or paste job descriptions to start tailoring your AI interview practice to specific roles.
                </p>
                <Button className="bg-brand-600 hover:bg-brand-700" onClick={() => setIsModalOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Job Description
                </Button>
                <AddJobDescriptionModal
                    open={isModalOpen}
                    onOpenChange={setIsModalOpen}
                    onSuccess={(newJob) => setJobs(prev => [newJob, ...prev])}
                />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <AddJobDescriptionModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                onSuccess={(newJob) => setJobs(prev => [newJob, ...prev])}
            />

            <EditJobDescriptionModal
                job={editingJob}
                open={isEditModalOpen}
                onOpenChange={setIsEditModalOpen}
                onSuccess={(updatedJob) => {
                    setJobs(prev => prev.map(j => j.id === updatedJob.id ? updatedJob : j));
                }}
            />

            <AddToJobTrackerModal
                job={addToTrackerJob}
                open={!!addToTrackerJob}
                onOpenChange={(open) => !open && setAddToTrackerJob(null)}
                onSuccess={() => {
                    setAddToTrackerJob(null);
                    toast.success("Added to Job Tracker");
                    router.push("/dashboard/job-tracker");
                }}
            />

            <div className="flex justify-end">
                <Button className="bg-brand-600 hover:bg-brand-700" onClick={() => setIsModalOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add New Role
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {jobs.map((job) => (
                    <Card key={job.id} className="flex flex-col relative group overflow-hidden transition-all hover:shadow-md border-gray-200/60 w-full animate-in fade-in zoom-in-95 duration-200 ease-out">
                        <CardHeader className="pb-4">
                            <div className="flex justify-between items-start mb-2">
                                <StatusIcon status={job.status} />
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {job.status === "extracted" && (
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-brand-600" onClick={() => setAddToTrackerJob(job)} title="Add to Job Tracker">
                                            <Briefcase className="w-4 h-4" />
                                        </Button>
                                    )}
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-brand-600" onClick={() => { setEditingJob(job); setIsEditModalOpen(true); }}>
                                        <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-red-600" onClick={() => handleDelete(job.id)} disabled={isDeleting === job.id}>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                            <CardTitle className="text-lg font-semibold line-clamp-2" title={job.title}>{job.title}</CardTitle>
                            {job.company && (
                                <CardDescription className="text-brand-600 font-medium">{job.company}</CardDescription>
                            )}
                        </CardHeader>
                        <CardContent className="flex-1">
                            <p className="text-sm text-gray-600 line-clamp-3 mb-4">
                                {job.content.replace(/^[\s\n]+/, "").substring(0, 150)}...
                            </p>
                            {job.url && (
                                <a href={job.url} target="_blank" rel="noreferrer" className="inline-flex items-center text-xs font-medium text-brand-600 hover:text-brand-700 hover:underline">
                                    View Source <ExternalLink className="ml-1 w-3 h-3" />
                                </a>
                            )}
                        </CardContent>
                        <CardFooter className="bg-gray-50/50 border-t border-gray-100 py-3 text-xs text-gray-500 flex justify-between items-center mt-auto">
                            <div className="flex items-center">
                                <Calendar className="w-3 h-3 mr-1" />
                                {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
                            </div>
                            {job.status === "extracted" && (
                                <span className="font-medium text-gray-600">Context Ready</span>
                            )}
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
}
