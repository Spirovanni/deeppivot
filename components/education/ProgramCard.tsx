import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Clock, DollarSign, TrendingUp } from "lucide-react";

interface Program {
  id: number;
  name: string;
  provider: string;
  programType: string;
  duration: string;
  cost: number;
  roiScore: number | null;
  tags: string[];
  url: string;
  description: string;
}

const TYPE_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  bootcamp: { label: "Bootcamp", variant: "default" },
  certification: { label: "Certification", variant: "secondary" },
  degree: { label: "Degree", variant: "outline" },
  workshop: { label: "Workshop", variant: "outline" },
};

function formatCost(cents: number): string {
  if (cents === 0) return "Free";
  const dollars = cents / 100;
  if (dollars >= 1000) return `$${(dollars / 1000).toFixed(0)}K`;
  return `$${dollars.toLocaleString()}`;
}

function RoiBar({ score }: { score: number }) {
  const color =
    score >= 85 ? "bg-green-500" : score >= 70 ? "bg-amber-500" : "bg-orange-400";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 rounded-full bg-muted">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="w-8 text-right text-xs font-semibold tabular-nums">{score}</span>
    </div>
  );
}

export function ProgramCard({ program }: { program: Program }) {
  const typeCfg = TYPE_CONFIG[program.programType] ?? TYPE_CONFIG.certification;

  return (
    <Card className="flex flex-col transition-shadow hover:shadow-md">
      <CardContent className="flex flex-1 flex-col gap-3 p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-semibold leading-snug">{program.name}</p>
            <p className="text-sm text-muted-foreground">{program.provider}</p>
          </div>
          <Badge variant={typeCfg.variant} className="shrink-0 text-xs">
            {typeCfg.label}
          </Badge>
        </div>

        {/* Description */}
        <p className="line-clamp-2 text-sm text-muted-foreground">{program.description}</p>

        {/* Stats row */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="size-3" />
            {program.duration}
          </span>
          <span className="flex items-center gap-1">
            <DollarSign className="size-3" />
            {formatCost(program.cost)}
          </span>
        </div>

        {/* ROI score */}
        {program.roiScore !== null && (
          <div>
            <div className="mb-1 flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="size-3" />
              ROI Score
            </div>
            <RoiBar score={program.roiScore} />
          </div>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5">
          {program.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Learn More link */}
        <div className="mt-auto pt-1">
          <a
            href={program.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-primary/80"
          >
            Learn More
            <ExternalLink className="size-3.5" />
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
