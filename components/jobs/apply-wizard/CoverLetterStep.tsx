import { FileText, ExternalLink, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/utils";
import Link from "next/link";
import type { WizardState, CoverLetterOption } from "./types";

interface CoverLetterStepProps {
  coverLetters: CoverLetterOption[];
  loading: boolean;
  state: WizardState;
  onChange: (partial: Partial<WizardState>) => void;
  onNext: () => void;
  onBack: () => void;
}

const TONE_LABELS: Record<string, string> = {
  professional: "Professional",
  conversational: "Conversational",
  enthusiastic: "Enthusiastic",
};

export function CoverLetterStep({
  coverLetters,
  loading,
  state,
  onChange,
  onNext,
  onBack,
}: CoverLetterStepProps) {
  const showManual = state.coverLetterMode === "manual";
  const relevant = coverLetters.filter((cl) => cl.isRelevant);
  const others = coverLetters.filter((cl) => !cl.isRelevant);

  function selectCoverLetter(id: number) {
    onChange({ coverLetterMode: "select", selectedCoverLetterId: id });
  }

  function renderCard(cl: CoverLetterOption) {
    const isSelected = state.coverLetterMode === "select" && state.selectedCoverLetterId === cl.id;
    return (
      <button
        key={cl.id}
        type="button"
        onClick={() => selectCoverLetter(cl.id)}
        className={cn(
          "w-full flex flex-col gap-1.5 rounded-lg border p-3 text-left text-sm transition-colors",
          isSelected
            ? "border-primary bg-primary/5 ring-1 ring-primary"
            : "border-border hover:bg-accent/50"
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <p className="font-medium text-foreground truncate">
            {cl.jobTitle}
            {cl.jobCompany && (
              <span className="text-muted-foreground font-normal"> — {cl.jobCompany}</span>
            )}
          </p>
          <span className="shrink-0 text-xs rounded bg-muted px-1.5 py-0.5 text-muted-foreground">
            {TONE_LABELS[cl.tone] ?? cl.tone}
          </span>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2">{cl.content}</p>
        <p className="text-xs text-muted-foreground">
          {new Date(cl.createdAt).toLocaleDateString()}
        </p>
      </button>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-foreground">Select a Cover Letter</h3>
        <p className="text-sm text-muted-foreground mt-0.5">
          Choose an existing cover letter or write one now.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : !showManual ? (
        <>
          {coverLetters.length > 0 ? (
            <div className="space-y-3 max-h-52 overflow-y-auto">
              {relevant.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-1.5 flex items-center gap-1">
                    <Sparkles className="size-3" /> For this job
                  </p>
                  <div className="space-y-2">{relevant.map(renderCard)}</div>
                </div>
              )}
              {others.length > 0 && (
                <div>
                  {relevant.length > 0 && (
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 mt-3">
                      Other cover letters
                    </p>
                  )}
                  <div className="space-y-2">{others.map(renderCard)}</div>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border p-6 text-center">
              <FileText className="size-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground mb-2">No cover letters yet</p>
              <Link
                href="/dashboard/cover-letters"
                target="_blank"
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
              >
                Generate a cover letter <ExternalLink className="size-3" />
              </Link>
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onChange({ coverLetterMode: "manual", selectedCoverLetterId: null })}
              className="text-sm text-primary hover:underline"
            >
              Write manually instead
            </button>
            <span className="text-muted-foreground text-xs">or</span>
            <Link
              href="/dashboard/cover-letters"
              target="_blank"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              Generate new <ExternalLink className="size-3" />
            </Link>
          </div>
        </>
      ) : (
        <>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Cover Letter</label>
            <textarea
              value={state.manualCoverLetter}
              onChange={(e) => onChange({ manualCoverLetter: e.target.value })}
              rows={5}
              placeholder="Tell the employer why you're a great fit..."
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            />
          </div>
          <button
            type="button"
            onClick={() => onChange({ coverLetterMode: "skip", manualCoverLetter: "" })}
            className="text-sm text-primary hover:underline"
          >
            Choose from existing cover letters
          </button>
        </>
      )}

      <div className="flex justify-between gap-2 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent/50 transition-colors"
        >
          Back
        </button>
        <button
          type="button"
          onClick={() => {
            if (state.coverLetterMode !== "select" && state.coverLetterMode !== "manual") {
              onChange({ coverLetterMode: "skip" });
            }
            onNext();
          }}
          className={cn(
            "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
            state.coverLetterMode === "select" ||
              (state.coverLetterMode === "manual" && state.manualCoverLetter)
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "bg-muted text-muted-foreground hover:bg-accent"
          )}
        >
          {state.coverLetterMode === "select" ||
          (state.coverLetterMode === "manual" && state.manualCoverLetter)
            ? "Next"
            : "Skip"}
        </button>
      </div>
    </div>
  );
}
