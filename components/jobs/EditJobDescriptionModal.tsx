"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { JobDescription } from "@/components/jobs/types"; // We will create this shared type next

const formSchema = z.object({
    title: z.string().min(2, "Job title is required"),
    company: z.string().optional(),
    content: z.string().min(20, "Please provide the job description content"),
});

type FormValues = z.infer<typeof formSchema>;

export interface EditJobDescriptionModalProps {
    job: JobDescription | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: (updatedJob: JobDescription) => void;
}

export function EditJobDescriptionModal({ job, open, onOpenChange, onSuccess }: EditJobDescriptionModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isDirty },
    } = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: "",
            company: "",
            content: "",
        },
    });

    // Hydrate form when the job payload arrives
    useEffect(() => {
        if (job && open) {
            reset({
                title: job.title,
                company: job.company || "",
                content: job.content,
            });
        }
    }, [job, open, reset]);

    const onSubmit = async (data: FormValues) => {
        if (!job) return;

        setIsSubmitting(true);
        try {
            const response = await fetch(`/api/job-descriptions/${job.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw new Error("Failed to update job description");
            }

            const responseData = await response.json();

            toast.success("Job description updated successfully!");
            onSuccess(responseData.data);
            onOpenChange(false);
        } catch (error) {
            toast.error("Could not update job description. Please try again.");
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] gap-0 p-0 overflow-hidden">
                <div className="px-6 py-6 border-b bg-gray-50/50">
                    <DialogTitle className="text-xl">Edit Target Role</DialogTitle>
                    <DialogDescription className="mt-1.5">
                        Refine the parsed job description or update the company title.
                    </DialogDescription>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-6 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-title">Job Title <span className="text-red-500">*</span></Label>
                            <Input
                                id="edit-title"
                                placeholder="e.g. Senior Frontend Engineer"
                                {...register("title")}
                                className={errors.title ? "border-red-500" : ""}
                            />
                            {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-company">Company</Label>
                            <Input
                                id="edit-company"
                                placeholder="e.g. Acme Corp"
                                {...register("company")}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center mb-2">
                            <Label>Required Experience & Context <span className="text-red-500">*</span></Label>
                        </div>
                        <Textarea
                            placeholder="Paste the full job description here..."
                            className={`min-h-[300px] font-mono text-xs resize-y ${errors.content ? "border-red-500" : ""}`}
                            {...register("content")}
                        />
                        {errors.content && <p className="text-sm text-red-500">{errors.content.message}</p>}
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                            Cancel
                        </Button>
                        <Button type="submit" className="bg-brand-600 hover:bg-brand-700" disabled={isSubmitting || !isDirty}>
                            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Save Changes
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
