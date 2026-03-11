import { FileStack, FileText, AlertCircle } from "lucide-react";
import type { WizardState, ResumeOption, CoverLetterOption } from "./types";

interface ReviewStepProps {
  state: WizardState;
  resumes: ResumeOption[];
  coverLetters: CoverLetterOption[];
  jobTitle: string;
  companyName: string;
  onBack: () => void;
  onSubmit: () => void;
  loading: boolean;
  error: string | null;
}

export function ReviewStep({
  state,
  resumes,
  coverLetters,
  jobTitle,
  companyName,
  onBack,
  onSubmit,
  loading,
  error,
}: ReviewStepProps) {
  const selectedResume = resumes.find((r) => r.id === state.selectedResumeId) ?? null;
  const selectedCoverLetter =
    coverLetters.find((cl) => cl.id === state.selectedCoverLetterId) ?? null;

  const resumeLabel =
    state.resumeMode === "select" && selectedResume
      ? selectedResume.title
      : state.resumeMode === "manual" && state.manualResumeUrl
        ? state.manualResumeUrl
        : "None selected";

  const coverLetterLabel =
    state.coverLetterMode === "select" && selectedCoverLetter
      ? `${selectedCoverLetter.jobTitle} (${selectedCoverLetter.tone})`
      : state.coverLetterMode === "manual" && state.manualCoverLetter
        ? `${state.manualCoverLetter.slice(0, 80)}…`
        : "None selected";

  const hasResume = state.resumeMode !== "skip";
  const hasCoverLetter = state.coverLetterMode !== "skip";

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-foreground">Review Application</h3>
        <p className="text-sm text-muted-foreground mt-0.5">
          Confirm your details before submitting.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/30 px-3 py-2">
          <AlertCircle className="size-4 shrink-0 text-destructive mt-0.5" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <div className="rounded-lg border border-border divide-y divide-border">
        {/* Job */}
        <div className="p-3">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
            Position
          </p>
          <p className="text-sm font-medium text-foreground">{jobTitle}</p>
          <p className="text-xs text-muted-foreground">{companyName}</p>
        </div>

        {/* Resume */}
        <div className="p-3 flex items-start gap-2">
          <FileStack className="size-4 shrink-0 text-muted-foreground mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-0.5">
              Resume
            </p>
            <p className={`text-sm ${hasResume ? "text-foreground" : "text-muted-foreground italic"} truncate`}>
              {resumeLabel}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onBack()}
            className="text-xs text-primary hover:underline shrink-0"
          >
            Edit
          </button>
        </div>

        {/* Cover Letter */}
        <div className="p-3 flex items-start gap-2">
          <FileText className="size-4 shrink-0 text-muted-foreground mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-0.5">
              Cover Letter
            </p>
            <p className={`text-sm ${hasCoverLetter ? "text-foreground" : "text-muted-foreground italic"} truncate`}>
              {coverLetterLabel}
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-between gap-2 pt-2">
        <button
          type="button"
          onClick={onBack}
          disabled={loading}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent/50 transition-colors disabled:opacity-50"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={loading}
          className="rounded-lg bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {loading ? "Submitting..." : "Submit Application"}
        </button>
      </div>
    </div>
  );
}
