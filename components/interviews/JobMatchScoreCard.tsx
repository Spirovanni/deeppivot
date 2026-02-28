"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Briefcase, CheckCircle2, AlertTriangle, Building2 } from "lucide-react";

interface JobMatchScoreCardProps {
  jobTitle: string;
  companyName: string | null;
  technicalSkills: string[];
  softSkills: string[];
  culture: string | null;
  overallScore: number | null;
}

function getScoreColor(score: number): string {
  if (score >= 80) return "text-emerald-500";
  if (score >= 60) return "text-amber-500";
  return "text-red-500";
}

function getScoreLabel(score: number): string {
  if (score >= 80) return "Strong Match";
  if (score >= 60) return "Good Match";
  if (score >= 40) return "Moderate Match";
  return "Needs Improvement";
}

function getScoreBadgeVariant(score: number): "default" | "secondary" | "destructive" {
  if (score >= 60) return "default";
  if (score >= 40) return "secondary";
  return "destructive";
}

/** SVG radial gauge that fills clockwise based on a 0-100 score. */
function ScoreGauge({ score }: { score: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const colorClass = getScoreColor(score);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="140" height="140" viewBox="0 0 140 140" className="-rotate-90">
        {/* Background ring */}
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="10"
          className="text-muted/30"
        />
        {/* Score ring */}
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={`${colorClass} transition-all duration-1000 ease-out`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-3xl font-bold tabular-nums ${colorClass}`}>
          {score}%
        </span>
        <span className="text-xs text-muted-foreground">Match</span>
      </div>
    </div>
  );
}

export function JobMatchScoreCard({
  jobTitle,
  companyName,
  technicalSkills,
  softSkills,
  culture,
  overallScore,
}: JobMatchScoreCardProps) {
  const score = overallScore ?? 0;
  const topTechnical = technicalSkills.slice(0, 5);
  const topSoft = softSkills.slice(0, 4);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Briefcase className="size-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <CardTitle className="text-base font-semibold">
              Job Match Score
            </CardTitle>
            <p className="mt-0.5 truncate text-sm text-muted-foreground">
              {jobTitle}
              {companyName && (
                <span className="inline-flex items-center gap-1 ml-1.5">
                  <Building2 className="inline size-3" />
                  {companyName}
                </span>
              )}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Score gauge + label */}
        <div className="flex flex-col items-center gap-2 sm:flex-row sm:gap-6">
          <ScoreGauge score={score} />
          <div className="flex flex-col items-center gap-1.5 sm:items-start">
            <Badge variant={getScoreBadgeVariant(score)}>
              {getScoreLabel(score)}
            </Badge>
            {culture && (
              <p className="max-w-xs text-xs text-muted-foreground text-center sm:text-left">
                {culture}
              </p>
            )}
          </div>
        </div>

        {/* Skills alignment */}
        {(topTechnical.length > 0 || topSoft.length > 0) && (
          <div className="space-y-3 border-t pt-4">
            {topTechnical.length > 0 && (
              <div>
                <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <CheckCircle2 className="size-3.5 text-emerald-500" />
                  Technical Skills Required
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {topTechnical.map((skill) => (
                    <Badge key={skill} variant="outline" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                  {technicalSkills.length > 5 && (
                    <Badge variant="outline" className="text-xs text-muted-foreground">
                      +{technicalSkills.length - 5} more
                    </Badge>
                  )}
                </div>
              </div>
            )}
            {topSoft.length > 0 && (
              <div>
                <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <AlertTriangle className="size-3.5 text-amber-500" />
                  Soft Skills to Demonstrate
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {topSoft.map((skill) => (
                    <Badge key={skill} variant="secondary" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                  {softSkills.length > 4 && (
                    <Badge variant="secondary" className="text-xs text-muted-foreground">
                      +{softSkills.length - 4} more
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
