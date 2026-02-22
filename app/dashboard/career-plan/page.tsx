import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/src/db";
import {
  careerMilestonesTable,
  careerResourcesTable,
  usersTable,
} from "@/src/db/schema";
import { eq, asc } from "drizzle-orm";
import { MilestoneTimeline } from "@/components/career-plan/MilestoneTimeline";
import { MapPin } from "lucide-react";

export default async function CareerPlanPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const [dbUser] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.clerkId, user.id))
    .limit(1);

  if (!dbUser) redirect("/sign-in");

  const milestones = await db.query.careerMilestonesTable.findMany({
    where: eq(careerMilestonesTable.userId, dbUser.id),
    orderBy: [asc(careerMilestonesTable.orderIndex)],
    with: {
      resources: {
        orderBy: [asc(careerResourcesTable.createdAt)],
      },
    },
  });

  const completedCount = milestones.filter((m) => m.status === "completed").length;
  const inProgressCount = milestones.filter((m) => m.status === "in_progress").length;

  return (
    <div className="p-6 md:p-8">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Career Plan</h1>
          <p className="mt-1 text-muted-foreground">
            Build your personalized roadmap with draggable milestones and curated resources.
          </p>

          {milestones.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="inline-block size-2.5 rounded-full bg-muted-foreground" />
                <span className="text-muted-foreground">
                  {milestones.length - completedCount - inProgressCount} planned
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block size-2.5 rounded-full bg-primary" />
                <span className="text-muted-foreground">{inProgressCount} in progress</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block size-2.5 rounded-full bg-green-500" />
                <span className="text-muted-foreground">{completedCount} completed</span>
              </div>
            </div>
          )}
        </div>

        {/* Progress bar (shown when there are milestones) */}
        {milestones.length > 0 && (
          <div className="mb-8 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="size-3" />
                Overall Progress
              </span>
              <span>{Math.round((completedCount / milestones.length) * 100)}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-green-500 transition-all duration-500"
                style={{
                  width: `${Math.round((completedCount / milestones.length) * 100)}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Draggable timeline */}
        <MilestoneTimeline initialMilestones={milestones} />
      </div>
    </div>
  );
}
