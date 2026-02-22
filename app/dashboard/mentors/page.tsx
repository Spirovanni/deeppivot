import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/src/db";
import { usersTable, mentorConnectionsTable } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import {
  seedMentors,
  getMentors,
} from "@/src/lib/actions/mentors";
import { MentorGrid } from "@/components/mentors/MentorGrid";

export default async function MentorsPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  // Ensure seed data exists (idempotent)
  await seedMentors();

  const [dbUser] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.clerkId, user.id))
    .limit(1);

  if (!dbUser) redirect("/sign-in");

  const [mentors, rawConnections] = await Promise.all([
    getMentors(),
    db
      .select({
        mentorId: mentorConnectionsTable.mentorId,
        status: mentorConnectionsTable.status,
      })
      .from(mentorConnectionsTable)
      .where(eq(mentorConnectionsTable.userId, dbUser.id)),
  ]);

  return (
    <div className="p-6 md:p-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Mentor & Coach Network
          </h1>
          <p className="mt-1 text-muted-foreground">
            Connect with industry mentors and workforce development partners for
            personalised guidance.
          </p>
        </div>

        {/* Searchable, filterable grid */}
        <MentorGrid
          mentors={mentors}
          connections={rawConnections}
        />
      </div>
    </div>
  );
}
