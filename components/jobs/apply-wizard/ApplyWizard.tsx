"use client";

import { useState, useEffect, useCallback } from "react";
import { useShowPointsAnimation } from "@/src/store/gamification";
import { DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { WizardStepIndicator } from "./WizardStepIndicator";
import { ResumeStep } from "./ResumeStep";
import { CoverLetterStep } from "./CoverLetterStep";
import { ReviewStep } from "./ReviewStep";
import { INITIAL_STATE, type WizardState, type ResumeOption, type CoverLetterOption } from "./types";

interface ApplyWizardProps {
  jobId: number;
  jobTitle: string;
  companyName: string;
  boardId: number;
  onClose: () => void;
  onSuccess: () => void;
}

export function ApplyWizard({
  jobId,
  jobTitle,
  companyName,
  boardId,
  onClose,
  onSuccess,
}: ApplyWizardProps) {
  const showPoints = useShowPointsAnimation();
  const [state, setState] = useState<WizardState>(INITIAL_STATE);
  const [resumes, setResumes] = useState<ResumeOption[]>([]);
  const [coverLetters, setCoverLetters] = useState<CoverLetterOption[]>([]);
  const [loadingResumes, setLoadingResumes] = useState(true);
  const [loadingCoverLetters, setLoadingCoverLetters] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = useCallback((partial: Partial<WizardState>) => {
    setState((prev) => ({ ...prev, ...partial }));
  }, []);

  // Fetch resumes and cover letters on mount
  useEffect(() => {
    fetch("/api/resumes")
      .then((r) => r.json())
      .then((data) => {
        setResumes(Array.isArray(data) ? data : []);
        // Auto-select default resume if one exists
        const defaultResume = (data as ResumeOption[]).find(
          (r) => r.isDefault && r.status === "extracted" && r.fileUrl
        );
        if (defaultResume) {
          setState((prev) => ({
            ...prev,
            resumeMode: "select",
            selectedResumeId: defaultResume.id,
          }));
        }
      })
      .catch(() => setResumes([]))
      .finally(() => setLoadingResumes(false));

    fetch(`/api/cover-letters?jobId=${jobId}`)
      .then((r) => r.json())
      .then((data) => setCoverLetters(Array.isArray(data) ? data : []))
      .catch(() => setCoverLetters([]))
      .finally(() => setLoadingCoverLetters(false));
  }, [jobId]);

  function goNext() {
    setState((prev) => ({
      ...prev,
      step: Math.min(prev.step + 1, 3) as 1 | 2 | 3,
    }));
  }

  function goBack() {
    setError(null);
    setState((prev) => ({
      ...prev,
      step: Math.max(prev.step - 1, 1) as 1 | 2 | 3,
    }));
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);

    // Map selections to API fields
    let resumeUrl: string | null = null;
    if (state.resumeMode === "select" && state.selectedResumeId) {
      const resume = resumes.find((r) => r.id === state.selectedResumeId);
      resumeUrl = resume?.fileUrl ?? null;
    } else if (state.resumeMode === "manual" && state.manualResumeUrl) {
      resumeUrl = state.manualResumeUrl;
    }

    let coverLetter: string | null = null;
    if (state.coverLetterMode === "select" && state.selectedCoverLetterId) {
      const cl = coverLetters.find((c) => c.id === state.selectedCoverLetterId);
      coverLetter = cl?.content ?? null;
    } else if (state.coverLetterMode === "manual" && state.manualCoverLetter) {
      coverLetter = state.manualCoverLetter;
    }

    try {
      const res = await fetch(`/api/jobs/${jobId}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeUrl, coverLetter, boardId }),
      });
      const data = await res.json();
      if (res.status === 409) throw new Error("You've already applied for this job.");
      if (res.status === 410) throw new Error("This job is no longer accepting applications.");
      if (!res.ok) throw new Error(data.error ?? "Failed to submit application");
      if (data.pointsAwarded) {
        showPoints(data.pointsAwarded, "Application submitted");
      }
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <DialogHeader className="mb-4">
        <DialogTitle>Apply for {jobTitle}</DialogTitle>
        <DialogDescription>{companyName}</DialogDescription>
      </DialogHeader>

      <WizardStepIndicator current={state.step} />

      {state.step === 1 && (
        <ResumeStep
          resumes={resumes}
          loading={loadingResumes}
          state={state}
          onChange={update}
          onNext={goNext}
        />
      )}

      {state.step === 2 && (
        <CoverLetterStep
          coverLetters={coverLetters}
          loading={loadingCoverLetters}
          state={state}
          onChange={update}
          onNext={goNext}
          onBack={goBack}
        />
      )}

      {state.step === 3 && (
        <ReviewStep
          state={state}
          resumes={resumes}
          coverLetters={coverLetters}
          jobTitle={jobTitle}
          companyName={companyName}
          onBack={goBack}
          onSubmit={handleSubmit}
          loading={submitting}
          error={error}
        />
      )}
    </div>
  );
}
