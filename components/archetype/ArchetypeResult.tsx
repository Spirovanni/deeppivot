import { ARCHETYPES, DIMENSION_LABELS, type TraitScore } from "@/src/lib/archetypes";
import { TraitRadar } from "./TraitRadar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, TrendingUp, Briefcase, RotateCcw } from "lucide-react";
import { deleteArchetype } from "@/src/lib/actions/archetype";

interface ArchetypeResultProps {
  archetypeName: string;
  traits: TraitScore[];
  strengths: string[];
  growthAreas: string[];
  assessedAt: Date;
}

export function ArchetypeResult({
  archetypeName,
  traits,
  strengths,
  growthAreas,
  assessedAt,
}: ArchetypeResultProps) {
  const definition = ARCHETYPES.find((a) => a.name === archetypeName) ?? ARCHETYPES[0];

  return (
    <div className="space-y-6">
      {/* Hero card */}
      <Card className="overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <span className="text-5xl" role="img" aria-label={definition.name}>
                {definition.emoji}
              </span>
              <div>
                <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  Your Career Archetype
                </p>
                <h2 className="mt-0.5 text-2xl font-bold">{definition.name}</h2>
                <p className="mt-1 text-sm text-muted-foreground italic">
                  {definition.tagline}
                </p>
              </div>
            </div>
            <form action={deleteArchetype}>
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <RotateCcw className="size-3" />
                Retake
              </button>
            </form>
          </div>

          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            {definition.description}
          </p>

          <p className="mt-3 text-xs text-muted-foreground/60">
            Assessed on{" "}
            {new Date(assessedAt).toLocaleDateString(undefined, {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </CardContent>
      </Card>

      {/* Trait radar */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Your Trait Profile</CardTitle>
          <p className="text-sm text-muted-foreground">
            Dimension scores based on your assessment answers (1–5 scale).
          </p>
        </CardHeader>
        <CardContent>
          <TraitRadar traits={traits} />
          {/* Dimension score bars */}
          <div className="mt-4 space-y-2">
            {traits.map((t) => (
              <div key={t.dimension} className="flex items-center gap-3">
                <span className="w-24 shrink-0 text-xs text-muted-foreground">
                  {DIMENSION_LABELS[t.dimension]}
                </span>
                <div className="relative h-2 flex-1 rounded-full bg-muted">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-primary transition-all"
                    style={{ width: `${(t.normalized / 5) * 100}%` }}
                  />
                </div>
                <span className="w-8 text-right text-xs tabular-nums text-muted-foreground">
                  {t.normalized.toFixed(1)}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Strengths + Growth */}
      <div className="grid gap-6 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <CheckCircle2 className="size-4 text-green-500" />
              Strengths
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {strengths.map((s) => (
                <li key={s} className="flex gap-2 text-sm">
                  <span className="mt-0.5 shrink-0 text-green-500">•</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <TrendingUp className="size-4 text-orange-500" />
              Growth Areas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {growthAreas.map((g) => (
                <li key={g} className="flex gap-2 text-sm">
                  <span className="mt-0.5 shrink-0 text-orange-500">•</span>
                  <span>{g}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Ideal roles */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Briefcase className="size-4 text-primary" />
            Ideal Roles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {definition.idealRoles.map((role) => (
              <Badge key={role} variant="secondary">
                {role}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
