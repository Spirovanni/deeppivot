import Link from "next/link";
import { ARCHETYPES, DIMENSION_LABELS, type TraitScore } from "@/src/lib/archetypes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, UserCircle } from "lucide-react";

interface CareerArchetypeCardProps {
  archetypeName: string;
  traits: TraitScore[];
  strengths: string[];
  growthAreas: string[];
  assessedAt: Date;
}

export function CareerArchetypeCard({
  archetypeName,
  traits,
  strengths,
  growthAreas,
  assessedAt,
}: CareerArchetypeCardProps) {
  const definition = ARCHETYPES.find((a) => a.name === archetypeName) ?? ARCHETYPES[0];

  const topTraits = traits
    .sort((a, b) => b.normalized - a.normalized)
    .slice(0, 3);

  return (
    <Link href="/dashboard/archetype">
      <Card className="h-full transition-colors hover:bg-accent/50">
        <CardHeader className="flex flex-row items-start justify-between gap-4 pb-2">
          <div className="flex items-start gap-3">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <span className="text-2xl" role="img" aria-label={definition.name}>
                {definition.emoji}
              </span>
            </div>
            <div>
              <CardTitle className="text-base">Your Career Archetype</CardTitle>
              <p className="mt-0.5 font-semibold text-foreground">{definition.name}</p>
              <p className="mt-0.5 text-sm italic text-muted-foreground">
                {definition.tagline}
              </p>
            </div>
          </div>
          <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {definition.description}
          </p>

          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Key traits
            </p>
            <div className="flex flex-wrap gap-2">
              {topTraits.map((t) => (
                <span
                  key={t.dimension}
                  className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs"
                >
                  {DIMENSION_LABELS[t.dimension]} {t.normalized.toFixed(1)}
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {strengths.slice(0, 2).map((s) => (
              <span
                key={s}
                className="truncate rounded border border-green-500/30 bg-green-500/5 px-2 py-0.5 text-xs text-green-700 dark:text-green-400"
              >
                {s}
              </span>
            ))}
          </div>

          <p className="text-xs text-muted-foreground/80">
            Assessed {new Date(assessedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}

export function CareerArchetypeEmptyCard() {
  return (
    <Link href="/dashboard/archetype">
      <Card className="h-full transition-colors hover:bg-accent/50">
        <CardHeader className="flex flex-row items-center gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <UserCircle className="size-6 text-primary" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-base">Career Archetype</CardTitle>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Take the assessment or complete an interview to discover your career persona.
            </p>
          </div>
          <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
        </CardHeader>
      </Card>
    </Link>
  );
}
