import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Calendar, DollarSign } from "lucide-react";

interface FundingOpportunity {
  id: number;
  name: string;
  fundingType: string;
  amount: number | null;
  eligibilityText: string;
  applicationUrl: string;
  deadline: Date | null;
}

const FUNDING_CONFIG: Record<
  string,
  { label: string; variant: "default" | "secondary" | "outline"; color: string }
> = {
  scholarship: { label: "Scholarship", variant: "default", color: "text-indigo-500" },
  grant: { label: "Grant", variant: "secondary", color: "text-green-600" },
  loan: { label: "Loan", variant: "outline", color: "text-amber-600" },
  isa: { label: "ISA", variant: "outline", color: "text-purple-600" },
};

function formatAmount(cents: number | null): string {
  if (cents === null) return "Varies";
  if (cents === 0) return "Free / Full Coverage";
  const dollars = cents / 100;
  if (dollars >= 1000) return `Up to $${(dollars / 1000).toFixed(0)}K`;
  return `Up to $${dollars.toLocaleString()}`;
}

export function FundingCard({ funding }: { funding: FundingOpportunity }) {
  const cfg = FUNDING_CONFIG[funding.fundingType] ?? FUNDING_CONFIG.grant;
  const isDeadlineSoon =
    funding.deadline &&
    new Date(funding.deadline).getTime() - Date.now() < 30 * 24 * 60 * 60 * 1000;

  return (
    <Card className="flex flex-col transition-shadow hover:shadow-md">
      <CardContent className="flex flex-1 flex-col gap-3 p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold leading-snug">{funding.name}</p>
          <Badge variant={cfg.variant} className="shrink-0 text-xs">
            {cfg.label}
          </Badge>
        </div>

        {/* Amount */}
        <div className="flex items-center gap-1.5 text-sm font-medium">
          <DollarSign className={`size-4 ${cfg.color}`} />
          <span>{formatAmount(funding.amount)}</span>
        </div>

        {/* Eligibility */}
        <p className="line-clamp-3 text-sm text-muted-foreground">
          {funding.eligibilityText}
        </p>

        {/* Deadline */}
        {funding.deadline && (
          <div
            className={`flex items-center gap-1.5 text-xs ${
              isDeadlineSoon ? "font-semibold text-rose-500" : "text-muted-foreground"
            }`}
          >
            <Calendar className="size-3" />
            Deadline:{" "}
            {new Date(funding.deadline).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
            {isDeadlineSoon && " · Soon!"}
          </div>
        )}

        {/* Apply link */}
        <div className="mt-auto pt-1">
          <a
            href={funding.applicationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-primary/80"
          >
            Apply Now
            <ExternalLink className="size-3.5" />
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
