"use client";

import { useState, useRef } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UploadCloud, FileText, Loader2, FileUp } from "lucide-react";
import toast from "react-hot-toast";

const formSchema = z.object({
    title: z.string().min(2, "Job title is required"),
    company: z.string().optional(),
    content: z.string().min(20, "Please provide the job description content"),
});

type FormValues = z.infer<typeof formSchema>;

export interface AddJobDescriptionModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: (job: any) => void;
}

export function AddJobDescriptionModal({ open, onOpenChange, onSuccess }: AddJobDescriptionModalProps) {
    const [activeTab, setActiveTab] = useState<"paste" | "upload">("paste");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // PDF processing state
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isExtracting, setIsExtracting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors },
    } = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: "",
            company: "",
            content: "",
        },
    });

    const contentValue = watch("content");

    const handleReset = () => {
        reset();
        setSelectedFile(null);
        setActiveTab("paste");
    };

    const onSubmit = async (data: FormValues) => {
        setIsSubmitting(true);
        try {
            const response = await fetch("/api/job-descriptions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw new Error("Failed to save job description");
            }

            const responseData = await response.json();

            toast.success("Job description added successfully!");
            onSuccess(responseData.data);
            handleReset();
            onOpenChange(false);
        } catch (error) {
            toast.error("Could not save job description. Please try again.");
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.type !== "application/pdf") {
            toast.error("Only PDF files are supported");
            return;
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            toast.error("File size must be less than 5MB");
            return;
        }

        setSelectedFile(file);
        setIsExtracting(true);

        try {
            const formData = new FormData();
            formData.append("file", file);

            const response = await fetch("/api/job-descriptions/extract", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                throw new Error("Failed to extract text from PDF");
            }

            const { data } = await response.json();
            setValue("content", data.text, { shouldValidate: true });
            toast.success("Text extracted from PDF!");
        } catch (error) {
            toast.error("Could not extract text. Try pasting it instead.");
            setSelectedFile(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
        } finally {
            setIsExtracting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(newOpen) => {
            if (!newOpen) handleReset();
            onOpenChange(newOpen);
        }}>
            <DialogContent className="sm:max-w-[600px] gap-0 p-0 overflow-hidden">
                <div className="px-6 py-6 border-b">
                    <DialogTitle className="text-xl">Add Target Role</DialogTitle>
                    <DialogDescription className="mt-1.5">
                        Add a job description to tailor your next AI mock interview.
                    </DialogDescription>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-6 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Job Title <span className="text-red-500">*</span></Label>
                            <Input
                                id="title"
                                placeholder="e.g. Senior Frontend Engineer"
                                {...register("title")}
                                className={errors.title ? "border-red-500" : ""}
                            />
                            {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="company">Company</Label>
                            <Input
                                id="company"
                                placeholder="e.g. Acme Corp"
                                {...register("company")}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Job Description Content <span className="text-red-500">*</span></Label>

                        <Tabs value={activeTab} onValueChange={(v: string) => setActiveTab(v as any)} className="w-full">
                            <TabsList className="grid w-full grid-cols-2 mb-4">
                                <TabsTrigger value="paste" className="flex items-center gap-2">
                                    <FileText className="w-4 h-4" />
                                    Paste Text
                                </TabsTrigger>
                                <TabsTrigger value="upload" className="flex items-center gap-2">
                                    <UploadCloud className="w-4 h-4" />
                                    Upload PDF
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="paste" className="mt-0 outline-none">
                                <Textarea
                                    placeholder="Paste the full job description here..."
                                    className={`min-h-[200px] resize-y ${errors.content ? "border-red-500" : ""}`}
                                    {...register("content")}
                                />
                            </TabsContent>

                            <TabsContent value="upload" className="mt-0 outline-none">
                                {!selectedFile ? (
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className={`border-2 border-dashed rounded-lg p-10 flex flex-col items-center justify-center cursor-pointer transition-colors bg-gray-50 hover:bg-gray-100 ${errors.content ? 'border-red-300' : 'border-gray-200'}`}
                                    >
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            className="hidden"
                                            accept="application/pdf"
                                            onChange={handleFileChange}
                                        />
                                        <div className="p-3 bg-white rounded-full shadow-sm mb-3">
                                            <FileUp className="w-6 h-6 text-brand-600" />
                                        </div>
                                        <p className="font-medium text-gray-900">Click to upload PDF</p>
                                        <p className="text-sm text-gray-500 mt-1">Max file size: 5MB</p>
                                    </div>
                                ) : (
                                    <div className="border rounded-lg p-4 bg-gray-50">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <FileText className="w-8 h-8 text-brand-500" />
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">{selectedFile.name}</p>
                                                    <p className="text-xs text-gray-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                                </div>
                                            </div>

                                            {isExtracting ? (
                                                <div className="flex items-center text-sm text-brand-600">
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                    Reading...
                                                </div>
                                            ) : (
                                                <Button type="button" variant="ghost" size="sm" onClick={() => {
                                                    setSelectedFile(null);
                                                    setValue("content", "");
                                                    if (fileInputRef.current) fileInputRef.current.value = "";
                                                }}>
                                                    Remove
                                                </Button>
                                            )}
                                        </div>

                                        {contentValue && !isExtracting && (
                                            <div className="mt-4 pt-4 border-t border-gray-200">
                                                <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">Extracted Text Preview</p>
                                                <div className="bg-white p-3 rounded border text-xs text-gray-600 max-h-32 overflow-y-auto whitespace-pre-wrap">
                                                    {contentValue}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </TabsContent>
                        </Tabs>

                        {errors.content && activeTab === "paste" && <p className="text-sm text-red-500">{errors.content.message}</p>}
                        {errors.content && activeTab === "upload" && !selectedFile && <p className="text-sm text-red-500">Please upload a PDF or paste text</p>}
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting || isExtracting}>
                            Cancel
                        </Button>
                        <Button type="submit" className="bg-brand-600 hover:bg-brand-700" disabled={isSubmitting || isExtracting}>
                            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Save Target Role
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
