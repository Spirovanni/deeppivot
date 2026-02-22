import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/src/db";
import { usersTable, jobBoardsTable, jobColumnsTable, jobApplicationsTable } from "@/src/db/schema";
import { eq, asc } from "drizzle-orm";
import { KanbanBoard } from "@/components/job-tracker/KanbanBoard";
import { initializeJobBoard } from "@/src/lib/actions/job-board";

export default async function JobTrackerPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  // Look up DB user by clerkId
  const [dbUser] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkId, user.id))
    .limit(1);

  if (!dbUser) redirect("/sign-in");

  // Ensure board exists (idempotent)
  await initializeJobBoard(dbUser.id);

  // Fetch board with columns and jobs using relational queries
  const board = await db.query.jobBoardsTable.findFirst({
    where: eq(jobBoardsTable.userId, dbUser.id),
    with: {
      columns: {
        orderBy: [asc(jobColumnsTable.order)],
        with: {
          jobs: {
            orderBy: [asc(jobApplicationsTable.order)],
          },
        },
      },
    },
  });

  if (!board) redirect("/sign-in");

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="mx-auto max-w-[1600px] px-6 py-4">
          <h1 className="text-2xl font-bold">{board.name}</h1>
          <p className="text-sm text-muted-foreground">
            Track your job applications across {board.columns.length} stages
          </p>
        </div>
      </div>
      <div className="mx-auto max-w-[1600px] px-6 py-6">
        <KanbanBoard board={board} userId={dbUser.id} />
      </div>
    </div>
  );
}
