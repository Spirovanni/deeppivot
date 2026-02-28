import Link from "next/link";
import {
  CheckCircle2,
  AlertCircle,
  CircleDashed,
  Briefcase,
  Clock,
  ListChecks,
  Lightbulb,
  Mic2,
  Building2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface GapAnalysisPanelProps {
  jobTitle: string;
  companyName: string | null;
  technicalSkills: string[];
  softSkills: string[];
  yearsOfExperience: string | null;
  responsibilities: string[];
  likelyTopics: string[];
  sessionType: string;
  overallScore: number | null;
  jobDescriptionId: number;
}

function ScoreBand({ score }: { score: number }) {
  if (score >= 80)
    return (
      <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
        <CheckCircle2 className="size-3.5" />
        Strong Match — {score}%
      </span>
    );
  if (score >= 60)
    return (
      <span className="flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
        <AlertCircle className="size-3.5" />
        Good Match — {score}%
      </span>
    );
  return (
    <span className="flex items-center gap-1 text-xs font-semibold text-red-600 dark:text-red-400">
      <CircleDashed className="size-3.5" />
      Needs Improvement — {score}%
    </span>
  );
}

/**
 * Post-interview gap analysis panel shown on the feedback page when a
 * session was started against a specific job description.
 *
 * Displays:
 *  - Overall match score band
 *  - Technical skills required by the JD (prompted to address in future)
 *  - Soft skills to demonstrate
 *  - Key responsibilities the interview should have covered
 *  - Likely interview topics the user should keep practising
 *  - Experience requirement reminder
 *  - "Practice again" CTA pre-linked to the same JD
 */
export function GapAnalysisPanel({
  jobTitle,
  companyName,
  technicalSkills,
  softSkills,
  yearsOfExperience,
  responsibilities,
  likelyTopics,
  overallScore,
  jobDescriptionId,
}: GapAnalysisPanelProps) {
  const score = overallScore ?? null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Briefcase className="size-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <CardTitle className="text-base font-semibold">
              JD Gap Analysis
            </CardTitle>
            <p className="mt-0.5 truncate text-sm text-muted-foreground">
              {jobTitle}
              {companyName && (
                <span className="ml-1.5 inline-flex items-center gap-1">
                  <Building2 className="inline size-3" />
                  {companyName}
                </span>
              )}
            </p>
            {score !== null && (
              <div className="mt-1.5">
                <ScoreBand score={score} />
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 text-sm">
        {/* Technical skills */}
        {technicalSkills.length > 0 && (
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <CheckCircle2 className="size-3.5 text-emerald-500" />
              Technical Skills Required
            </p>
            <div className="flex flex-wrap gap-1.5">
              {technicalSkills.map((skill) => (
                <Badge key={skill} variant="outline" className="text-xs">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Soft skills */}
        {softSkills.length > 0 && (
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <AlertCircle className="size-3.5 text-amber-500" />
              Soft Skills to Demonstrate
            </p>
            <div className="flex flex-wrap gap-1.5">
              {softSkills.map((skill) => (
                <Badge key={skill} variant="secondary" className="text-xs">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Responsibilities */}
        {responsibilities.length > 0 && (
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <ListChecks className="size-3.5 text-blue-500" />
              Key Responsibilities to Address
            </p>
            <ul className="space-y-1.5">
              {responsibilities.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-blue-400/60" />
                  <span className="leading-relaxed">{r}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Likely interview topics */}
        {likelyTopics.length > 0 && (
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Lightbulb className="size-3.5 text-violet-500" />
              Topics to Keep Practising
            </p>
            <ul className="space-y-1.5">
              {likelyTopics.map((t, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-violet-400/60" />
                  <span className="leading-snug">{t}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Experience requirement */}
        {yearsOfExperience && (
          <div className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-2.5">
            <Clock className="size-4 shrink-0 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">Experience required:</span>{" "}
              {yearsOfExperience}
            </p>
          </div>
        )}

        {/* Practice again CTA */}
        <div className="border-t pt-4">
          <Link
            href={`/dashboard/interviews?practiceJobId=${jobDescriptionId}`}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary/8 px-4 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <Mic2 className="size-4" />
            Practice for this Job Again
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
