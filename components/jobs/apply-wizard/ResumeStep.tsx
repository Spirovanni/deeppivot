import { FileStack, ExternalLink, Loader2, Star } from "lucide-react";
import { cn } from "@/utils";
import Link from "next/link";
import type { WizardState, ResumeOption } from "./types";

interface ResumeStepProps {
  resumes: ResumeOption[];
  loading: boolean;
  state: WizardState;
  onChange: (partial: Partial<WizardState>) => void;
  onNext: () => void;
}

export function ResumeStep({ resumes, loading, state, onChange, onNext }: ResumeStepProps) {
  const selectableResumes = resumes.filter((r) => r.status === "extracted" && r.fileUrl);
  const showManual = state.resumeMode === "manual";

  function selectResume(id: number) {
    onChange({ resumeMode: "select", selectedResumeId: id });
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-foreground">Select a Resume</h3>
        <p className="text-sm text-muted-foreground mt-0.5">
          Choose one of your uploaded resumes or enter a URL manually.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : !showManual ? (
        <>
          {selectableResumes.length > 0 ? (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {selectableResumes.map((resume) => (
                <button
                  key={resume.id}
                  type="button"
                  onClick={() => selectResume(resume.id)}
                  className={cn(
                    "w-full flex items-center gap-3 rounded-lg border p-3 text-left text-sm transition-colors",
                    state.resumeMode === "select" && state.selectedResumeId === resume.id
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border hover:bg-accent/50"
                  )}
                >
                  <FileStack className="size-4 shrink-0 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{resume.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(resume.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {resume.isDefault && (
                    <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                      <Star className="size-3" />
                      Default
                    </span>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border p-6 text-center">
              <FileStack className="size-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground mb-2">No resumes uploaded yet</p>
              <Link
                href="/dashboard/practice/resumes"
                target="_blank"
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
              >
                Upload a resume <ExternalLink className="size-3" />
              </Link>
            </div>
          )}

          <button
            type="button"
            onClick={() => onChange({ resumeMode: "manual", selectedResumeId: null })}
            className="text-sm text-primary hover:underline"
          >
            Enter URL manually instead
          </button>
        </>
      ) : (
        <>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Resume URL</label>
            <input
              value={state.manualResumeUrl}
              onChange={(e) => onChange({ manualResumeUrl: e.target.value })}
              placeholder="https://drive.google.com/..."
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <p className="text-xs text-muted-foreground mt-1">Link to your resume (Google Drive, Dropbox, etc.)</p>
          </div>
          <button
            type="button"
            onClick={() => onChange({ resumeMode: "skip", manualResumeUrl: "" })}
            className="text-sm text-primary hover:underline"
          >
            Choose from uploaded resumes
          </button>
        </>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={() => {
            if (state.resumeMode !== "select" && state.resumeMode !== "manual") {
              onChange({ resumeMode: "skip" });
            }
            onNext();
          }}
          className={cn(
            "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
            state.resumeMode === "select" || (state.resumeMode === "manual" && state.manualResumeUrl)
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "bg-muted text-muted-foreground hover:bg-accent"
          )}
        >
          {state.resumeMode === "select" || (state.resumeMode === "manual" && state.manualResumeUrl)
            ? "Next"
            : "Skip"}
        </button>
      </div>
    </div>
  );
}
