"use client";

import { useState, useTransition, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import type { ResumeExtraction } from "@/src/lib/llm/prompts/resumes";

const EMPTY_WORK = {
    company: "",
    title: "",
    startDate: null as string | null,
    endDate: null as string | null,
    highlights: [] as string[],
};

const EMPTY_EDUCATION = {
    institution: "",
    degree: "",
    field: null as string | null,
    graduationDate: null as string | null,
};

const DEFAULT_PARSED: ResumeExtraction = {
    fullName: "",
    email: null,
    phone: null,
    location: null,
    summary: null,
    skills: [],
    workExperience: [],
    education: [],
    certifications: [],
    yearsOfExperience: null,
};

interface ParsedResumeVerificationModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    resumeId: number;
    initialData: ResumeExtraction | null;
    onSaved?: () => void;
}

export function ParsedResumeVerificationModal({
    open,
    onOpenChange,
    resumeId,
    initialData,
    onSaved,
}: ParsedResumeVerificationModalProps) {
    const [data, setData] = useState<ResumeExtraction>(() =>
        initialData
            ? {
                  fullName: initialData.fullName ?? "",
                  email: initialData.email ?? null,
                  phone: initialData.phone ?? null,
                  location: initialData.location ?? null,
                  summary: initialData.summary ?? null,
                  skills: initialData.skills ?? [],
                  workExperience:
                      (initialData.workExperience?.length ?? 0) > 0
                          ? initialData.workExperience!
                          : [{ ...EMPTY_WORK }],
                  education:
                      (initialData.education?.length ?? 0) > 0
                          ? initialData.education!
                          : [{ ...EMPTY_EDUCATION }],
                  certifications: initialData.certifications ?? [],
                  yearsOfExperience: initialData.yearsOfExperience ?? null,
              }
            : { ...DEFAULT_PARSED, workExperience: [{ ...EMPTY_WORK }], education: [{ ...EMPTY_EDUCATION }] }
    );
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        if (open && initialData) {
            setData({
                fullName: initialData.fullName ?? "",
                email: initialData.email ?? null,
                phone: initialData.phone ?? null,
                location: initialData.location ?? null,
                summary: initialData.summary ?? null,
                skills: initialData.skills ?? [],
                workExperience: initialData.workExperience?.length
                    ? initialData.workExperience
                    : [{ ...EMPTY_WORK }],
                education: initialData.education?.length
                    ? initialData.education
                    : [{ ...EMPTY_EDUCATION }],
                certifications: initialData.certifications ?? [],
                yearsOfExperience: initialData.yearsOfExperience ?? null,
            });
        }
    }, [open, initialData]);

    const updateWork = (index: number, field: keyof typeof EMPTY_WORK, value: unknown) => {
        setData((prev) => {
            const next = [...(prev.workExperience || [])];
            next[index] = { ...next[index], [field]: value };
            return { ...prev, workExperience: next };
        });
    };

    const addWork = () => {
        setData((prev) => ({
            ...prev,
            workExperience: [...(prev.workExperience || []), { ...EMPTY_WORK }],
        }));
    };

    const removeWork = (index: number) => {
        setData((prev) => ({
            ...prev,
            workExperience: prev.workExperience.filter((_, i) => i !== index),
        }));
    };

    const updateEducation = (index: number, field: keyof typeof EMPTY_EDUCATION, value: unknown) => {
        setData((prev) => {
            const next = [...(prev.education || [])];
            next[index] = { ...next[index], [field]: value };
            return { ...prev, education: next };
        });
    };

    const addEducation = () => {
        setData((prev) => ({
            ...prev,
            education: [...(prev.education || []), { ...EMPTY_EDUCATION }],
        }));
    };

    const removeEducation = (index: number) => {
        setData((prev) => ({
            ...prev,
            education: prev.education.filter((_, i) => i !== index),
        }));
    };

    const toPayload = (): ResumeExtraction => ({
        fullName: data.fullName.trim() || "",
        email: data.email?.trim() || null,
        phone: data.phone?.trim() || null,
        location: data.location?.trim() || null,
        summary: data.summary?.trim() || null,
        skills: Array.isArray(data.skills)
            ? data.skills.filter(Boolean).map((s) => String(s).trim())
            : [],
        workExperience: (data.workExperience || [])
            .map((w) => ({
                company: String(w.company).trim() || "",
                title: String(w.title).trim() || "",
                startDate: w.startDate?.trim() || null,
                endDate: w.endDate?.trim() || null,
                highlights: Array.isArray(w.highlights)
                    ? w.highlights.filter(Boolean).map((h) => String(h).trim())
                    : [],
            }))
            .filter((w) => w.company || w.title),
        education: (data.education || [])
            .map((e) => ({
                institution: String(e.institution).trim() || "",
                degree: String(e.degree).trim() || "",
                field: e.field?.trim() || null,
                graduationDate: e.graduationDate?.trim() || null,
            }))
            .filter((e) => e.institution || e.degree),
        certifications: Array.isArray(data.certifications)
            ? data.certifications.filter(Boolean).map((c) => String(c).trim())
            : [],
        yearsOfExperience: data.yearsOfExperience?.trim() || null,
    });

    const handleSave = () => {
        const payload = toPayload();
        startTransition(async () => {
            try {
                const res = await fetch(`/api/resumes/${resumeId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ parsedData: payload }),
                });
                if (!res.ok) throw new Error("Failed to save");
                toast.success("Resume data updated");
                onSaved?.();
                onOpenChange(false);
            } catch {
                toast.error("Could not save resume data");
            }
        });
    };

    const skillsStr = Array.isArray(data.skills) ? data.skills.join(", ") : "";
    const certsStr = Array.isArray(data.certifications) ? data.certifications.join(", ") : "";

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Verify parsed resume data</DialogTitle>
                    <DialogDescription>
                        Review and correct the information extracted from your resume. This data
                        powers cover letters and context-aware interviews.
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="flex-1 min-h-0 -mx-6 px-6">
                    <div className="space-y-6 py-2 pr-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <Label htmlFor="fullName">Full name</Label>
                                <Input
                                    id="fullName"
                                    value={data.fullName}
                                    onChange={(e) => setData((p) => ({ ...p, fullName: e.target.value }))}
                                    placeholder="Jane Doe"
                                />
                            </div>
                            <div>
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={data.email ?? ""}
                                    onChange={(e) =>
                                        setData((p) => ({ ...p, email: e.target.value || null }))
                                    }
                                    placeholder="jane@example.com"
                                />
                            </div>
                            <div>
                                <Label htmlFor="phone">Phone</Label>
                                <Input
                                    id="phone"
                                    value={data.phone ?? ""}
                                    onChange={(e) =>
                                        setData((p) => ({ ...p, phone: e.target.value || null }))
                                    }
                                    placeholder="+1 555 0123"
                                />
                            </div>
                            <div>
                                <Label htmlFor="location">Location</Label>
                                <Input
                                    id="location"
                                    value={data.location ?? ""}
                                    onChange={(e) =>
                                        setData((p) => ({ ...p, location: e.target.value || null }))
                                    }
                                    placeholder="San Francisco, CA"
                                />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="summary">Professional summary</Label>
                            <Textarea
                                id="summary"
                                value={data.summary ?? ""}
                                onChange={(e) =>
                                    setData((p) => ({ ...p, summary: e.target.value || null }))
                                }
                                placeholder="Brief professional summary..."
                                rows={2}
                                className="resize-none"
                            />
                        </div>

                        <div>
                            <Label htmlFor="skills">Skills (comma-separated)</Label>
                            <Input
                                id="skills"
                                value={skillsStr}
                                onChange={(e) =>
                                    setData((p) => ({
                                        ...p,
                                        skills: e.target.value
                                            .split(",")
                                            .map((s) => s.trim())
                                            .filter(Boolean),
                                    }))
                                }
                                placeholder="React, Python, Leadership"
                            />
                        </div>

                        <div>
                            <Label htmlFor="yearsOfExperience">Years of experience</Label>
                            <Input
                                id="yearsOfExperience"
                                value={data.yearsOfExperience ?? ""}
                                onChange={(e) =>
                                    setData((p) => ({
                                        ...p,
                                        yearsOfExperience: e.target.value || null,
                                    }))
                                }
                                placeholder="5 years"
                            />
                        </div>

                        <Accordion type="multiple" className="w-full" defaultValue={["work-0"]}>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Work experience</span>
                                <Button type="button" variant="ghost" size="sm" onClick={addWork}>
                                    <Plus className="size-4" />
                                </Button>
                            </div>
                            {(data.workExperience || []).map((w, i) => (
                                <AccordionItem key={i} value={`work-${i}`}>
                                    <AccordionTrigger className="hover:no-underline">
                                        <span className="truncate">
                                            {w.company || w.title || `Experience ${i + 1}`}
                                        </span>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <div className="space-y-3 pt-1">
                                            <div className="flex justify-end">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => removeWork(i)}
                                                >
                                                    <Trash2 className="size-4" />
                                                </Button>
                                            </div>
                                            <div className="grid gap-2 sm:grid-cols-2">
                                                <div>
                                                    <Label>Company</Label>
                                                    <Input
                                                        value={w.company}
                                                        onChange={(e) => updateWork(i, "company", e.target.value)}
                                                    />
                                                </div>
                                                <div>
                                                    <Label>Title</Label>
                                                    <Input
                                                        value={w.title}
                                                        onChange={(e) => updateWork(i, "title", e.target.value)}
                                                    />
                                                </div>
                                                <div>
                                                    <Label>Start date</Label>
                                                    <Input
                                                        value={w.startDate ?? ""}
                                                        onChange={(e) =>
                                                            updateWork(i, "startDate", e.target.value || null)
                                                        }
                                                        placeholder="Jan 2020"
                                                    />
                                                </div>
                                                <div>
                                                    <Label>End date</Label>
                                                    <Input
                                                        value={w.endDate ?? ""}
                                                        onChange={(e) =>
                                                            updateWork(i, "endDate", e.target.value || null)
                                                        }
                                                        placeholder="Present"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <Label>Highlights (one per line)</Label>
                                                <Textarea
                                                    value={(w.highlights || []).join("\n")}
                                                    onChange={(e) =>
                                                        updateWork(
                                                            i,
                                                            "highlights",
                                                            e.target.value.split("\n").filter(Boolean)
                                                        )
                                                    }
                                                    rows={3}
                                                    className="resize-none"
                                                />
                                            </div>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>

                        <Accordion type="multiple" className="w-full" defaultValue={["edu-0"]}>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Education</span>
                                <Button type="button" variant="ghost" size="sm" onClick={addEducation}>
                                    <Plus className="size-4" />
                                </Button>
                            </div>
                            {(data.education || []).map((e, i) => (
                                <AccordionItem key={i} value={`edu-${i}`}>
                                    <AccordionTrigger className="hover:no-underline">
                                        <span className="truncate">
                                            {e.institution || e.degree || `Education ${i + 1}`}
                                        </span>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <div className="space-y-3 pt-1">
                                            <div className="flex justify-end">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => removeEducation(i)}
                                                >
                                                    <Trash2 className="size-4" />
                                                </Button>
                                            </div>
                                            <div className="grid gap-2 sm:grid-cols-2">
                                                <div>
                                                    <Label>Institution</Label>
                                                    <Input
                                                        value={e.institution}
                                                        onChange={(ev) =>
                                                            updateEducation(i, "institution", ev.target.value)
                                                        }
                                                    />
                                                </div>
                                                <div>
                                                    <Label>Degree</Label>
                                                    <Input
                                                        value={e.degree}
                                                        onChange={(ev) =>
                                                            updateEducation(i, "degree", ev.target.value)
                                                        }
                                                    />
                                                </div>
                                                <div>
                                                    <Label>Field</Label>
                                                    <Input
                                                        value={e.field ?? ""}
                                                        onChange={(ev) =>
                                                            updateEducation(
                                                                i,
                                                                "field",
                                                                ev.target.value || null
                                                            )
                                                        }
                                                    />
                                                </div>
                                                <div>
                                                    <Label>Graduation date</Label>
                                                    <Input
                                                        value={e.graduationDate ?? ""}
                                                        onChange={(ev) =>
                                                            updateEducation(
                                                                i,
                                                                "graduationDate",
                                                                ev.target.value || null
                                                            )
                                                        }
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>

                        <div>
                            <Label htmlFor="certifications">Certifications (comma-separated)</Label>
                            <Input
                                id="certifications"
                                value={certsStr}
                                onChange={(e) =>
                                    setData((p) => ({
                                        ...p,
                                        certifications: e.target.value
                                            .split(",")
                                            .map((c) => c.trim())
                                            .filter(Boolean),
                                    }))
                                }
                                placeholder="AWS, PMP"
                            />
                        </div>
                    </div>
                </ScrollArea>

                <DialogFooter className="pt-4 border-t">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={isPending}>
                        {isPending ? "Saving…" : "Save changes"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
