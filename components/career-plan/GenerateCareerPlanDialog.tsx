"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Sparkles, Loader2, FileText, Briefcase, AlertCircle, ExternalLink } from "lucide-react";
import { useGenerateCareerPlan } from "@/src/lib/hooks/use-career-plans";
import Link from "next/link";

interface ResumeOption {
  id: number;
  title: string;
  status: string;
  isDefault?: boolean;
}

interface JdOption {
  id: number;
  title: string;
  company: string | null;
  status: string;
}

export function GenerateCareerPlanDialog() {
  const [open, setOpen] = useState(false);
  const [resumeId, setResumeId] = useState<number | null>(null);
  const [jdId, setJdId] = useState<number | null>(null);
  const [resumes, setResumes] = useState<ResumeOption[]>([]);
  const [jds, setJds] = useState<JdOption[]>([]);
  const [loading, setLoading] = useState(false);

  const generatePlan = useGenerateCareerPlan();

  // Fetch resumes and JDs when dialog opens
  useEffect(() => {
    if (!open) return;

    setLoading(true);
    Promise.all([
      fetch("/api/resumes").then((r) => (r.ok ? r.json() : [])),
      fetch("/api/job-descriptions").then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([resumeData, jdData]) => {
        const extracted = (resumeData as ResumeOption[]).filter(
          (r) => r.status === "extracted"
        );
        setResumes(extracted);
        if (extracted.length > 0) {
          const defaultResume = extracted.find((r) => r.isDefault);
          setResumeId(defaultResume?.id ?? extracted[0].id);
        }

        const extractedJds = (jdData as JdOption[]).filter(
          (j) => j.status === "extracted"
        );
        setJds(extractedJds);
        if (extractedJds.length > 0) {
          setJdId(extractedJds[0].id);
        }
      })
      .finally(() => setLoading(false));
  }, [open]);

  const handleGenerate = () => {
    if (!resumeId || !jdId) return;
    generatePlan.reset();
    generatePlan.mutate(
      { resumeId, jobDescriptionId: jdId },
      { onSuccess: () => setOpen(false) }
    );
  };

  const canGenerate = resumeId !== null && jdId !== null && !generatePlan.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Sparkles className="mr-1.5 size-4" />
          Generate with AI
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-5 text-primary" />
            Generate Career Plan
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            {/* Resume selection */}
            <div className="space-y-1.5">
              <Label htmlFor="gen-resume" className="flex items-center gap-1.5">
                <FileText className="size-3.5" />
                Resume
              </Label>
              {resumes.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border px-3 py-3 text-center">
                  <p className="text-sm text-muted-foreground">No resumes available</p>
                  <Link
                    href="/dashboard/practice/resumes"
                    className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    target="_blank"
                  >
                    Upload a resume <ExternalLink className="size-3" />
                  </Link>
                </div>
              ) : (
                <select
                  id="gen-resume"
                  value={resumeId ?? ""}
                  onChange={(e) => setResumeId(Number(e.target.value))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {resumes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.title}
                      {r.isDefault ? " (Default)" : ""}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Job description selection */}
            <div className="space-y-1.5">
              <Label htmlFor="gen-jd" className="flex items-center gap-1.5">
                <Briefcase className="size-3.5" />
                Target Job
              </Label>
              {jds.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border px-3 py-3 text-center">
                  <p className="text-sm text-muted-foreground">No job descriptions available</p>
                  <Link
                    href="/dashboard/job-descriptions"
                    className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    target="_blank"
                  >
                    Save a job description <ExternalLink className="size-3" />
                  </Link>
                </div>
              ) : (
                <select
                  id="gen-jd"
                  value={jdId ?? ""}
                  onChange={(e) => setJdId(Number(e.target.value))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {jds.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.title}
                      {j.company ? ` — ${j.company}` : ""}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Info note */}
            <div className="flex items-start gap-2 rounded-lg bg-muted/50 px-3 py-2.5">
              <AlertCircle className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                AI will also consider your career archetype, interview performance, and available
                education programs to create a personalized plan.
              </p>
            </div>

            {/* Error state */}
            {generatePlan.isError && (
              <div className="flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/30 px-3 py-2">
                <AlertCircle className="size-4 shrink-0 text-destructive mt-0.5" />
                <p className="text-sm text-destructive">
                  {generatePlan.error instanceof Error
                    ? generatePlan.error.message
                    : "Failed to generate career plan. Please try again."}
                </p>
              </div>
            )}

            {/* Generating state */}
            {generatePlan.isPending && (
              <div className="flex flex-col items-center gap-2 py-4">
                <Loader2 className="size-6 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground animate-pulse">
                  Generating your personalized career plan...
                </p>
                <p className="text-xs text-muted-foreground/70">
                  This may take 10-20 seconds
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
                disabled={generatePlan.isPending}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleGenerate}
                disabled={!canGenerate}
              >
                {generatePlan.isPending ? (
                  <>
                    <Loader2 className="mr-1.5 size-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-1.5 size-4" />
                    Generate Plan
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
