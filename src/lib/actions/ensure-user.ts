"use server";

import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/src/db";
import { usersTable } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { initializeJobBoard } from "@/src/lib/actions/job-board";

/**
 * Ensures the current Clerk user exists in our database.
 * Creates the user if missing (e.g. client-side sync failed).
 * Returns the DB user id, or null if unauthenticated.
 */
export async function ensureUserInDb(): Promise<number | null> {
  const clerkUser = await currentUser();
  if (!clerkUser?.id) return null;

  try {
    const [existing] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.clerkId, clerkUser.id))
      .limit(1);

    if (existing) return existing.id;

    const email =
      clerkUser.primaryEmailAddress?.emailAddress ??
      clerkUser.emailAddresses?.[0]?.emailAddress ??
      `${clerkUser.id}@clerk.placeholder`;

    const firstName = clerkUser.firstName ?? "";
    const lastName = clerkUser.lastName ?? "";
    const name =
      (clerkUser.fullName ?? `${firstName} ${lastName}`.trim()) || email;

    try {
      const [inserted] = await db
        .insert(usersTable)
      .values({
        clerkId: clerkUser.id,
        firstName,
        lastName,
        name,
        email,
        age: 25,
      })
      .onConflictDoUpdate({
        target: usersTable.clerkId,
        set: {
          firstName,
          lastName,
          name,
          email,
          updatedAt: new Date(),
        },
      })
      .returning({ id: usersTable.id });

      if (inserted?.id) {
        try {
          await initializeJobBoard(inserted.id);
        } catch {
          // Non-fatal
        }
        return inserted.id;
      }
    } catch (err) {
      console.error("ensureUserInDb: insert failed, retrying lookup", err);
      try {
        // Race: user may have been created by another request
        const [retry] = await db
          .select({ id: usersTable.id })
          .from(usersTable)
          .where(eq(usersTable.clerkId, clerkUser.id))
          .limit(1);
        if (retry) return retry.id;
        const [byEmail] = await db
          .select({ id: usersTable.id })
          .from(usersTable)
          .where(eq(usersTable.email, email))
          .limit(1);
        if (byEmail) {
          await db
            .update(usersTable)
            .set({ clerkId: clerkUser.id, updatedAt: new Date() })
            .where(eq(usersTable.id, byEmail.id));
          return byEmail.id;
        }
      } catch (retryErr) {
        console.error("ensureUserInDb: retry failed", retryErr);
      }
      return null;
    }
  } catch (err) {
    console.error("ensureUserInDb: database error", err);
    return null;
  }

  return null;
}
