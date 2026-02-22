import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getArchetype } from "@/src/lib/actions/archetype";
import { AssessmentForm } from "@/components/archetype/AssessmentForm";
import { ArchetypeResult } from "@/components/archetype/ArchetypeResult";
import { Sparkles } from "lucide-react";
import type { TraitScore } from "@/src/lib/archetypes";

export default async function ArchetypePage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const archetype = await getArchetype();

  return (
    <div className="p-6 md:p-8">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Career Archetype</h1>
          <p className="mt-1 text-muted-foreground">
            Discover your unique career persona through AI-powered behavioral trait modeling.
          </p>
        </div>

        {archetype ? (
          <ArchetypeResult
            archetypeName={archetype.archetypeName}
            traits={archetype.traits as TraitScore[]}
            strengths={archetype.strengths}
            growthAreas={archetype.growthAreas}
            assessedAt={archetype.assessedAt}
          />
        ) : (
          <div className="space-y-8">
            {/* CTA banner */}
            <div className="flex items-start gap-4 rounded-xl border border-primary/20 bg-primary/5 p-5">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Sparkles className="size-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold">Take the Career Archetype Assessment</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  18 questions · ~5 minutes · Covers analytical, creative, social, leadership,
                  technical, and empathetic dimensions. Rate each statement 1 (strongly disagree)
                  to 5 (strongly agree).
                </p>
              </div>
            </div>

            {/* Assessment form */}
            <AssessmentForm />
          </div>
        )}
      </div>
    </div>
  );
}
