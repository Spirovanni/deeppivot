import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { seedEducation, getPrograms, getFunding } from "@/src/lib/actions/education";
import { EducationExplorer } from "@/components/education/EducationExplorer";

export default async function EducationPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  // Seed if empty (idempotent)
  await seedEducation();

  const [programs, funding] = await Promise.all([getPrograms(), getFunding()]);

  const completedCount = programs.filter((p) => p.programType === "certification").length;
  const bootcampCount = programs.filter((p) => p.programType === "bootcamp").length;
  const freeCount = programs.filter((p) => p.cost === 0).length;

  return (
    <div className="p-6 md:p-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Education Explorer
          </h1>
          <p className="mt-1 text-muted-foreground">
            Discover bootcamps, certifications, degrees, and funding opportunities with
            ROI analysis.
          </p>

          {/* Quick stats */}
          {programs.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-6 text-sm">
              <div>
                <span className="text-2xl font-bold">{programs.length}</span>
                <span className="ml-1 text-muted-foreground">Programmes</span>
              </div>
              <div>
                <span className="text-2xl font-bold">{bootcampCount}</span>
                <span className="ml-1 text-muted-foreground">Bootcamps</span>
              </div>
              <div>
                <span className="text-2xl font-bold">{completedCount}</span>
                <span className="ml-1 text-muted-foreground">Certifications</span>
              </div>
              <div>
                <span className="text-2xl font-bold text-green-600">{freeCount}</span>
                <span className="ml-1 text-muted-foreground">Free Programmes</span>
              </div>
              <div>
                <span className="text-2xl font-bold">{funding.length}</span>
                <span className="ml-1 text-muted-foreground">Funding Sources</span>
              </div>
            </div>
          )}
        </div>

        {/* Interactive explorer */}
        <EducationExplorer programs={programs} funding={funding} />
      </div>
    </div>
  );
}
