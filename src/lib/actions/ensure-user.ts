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
    clerkUser.fullName ??
    `${firstName} ${lastName}`.trim() ||
    email;

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
    // Race: user may have been created by another request
    const [retry] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.clerkId, clerkUser.id))
      .limit(1);
    if (retry) return retry.id;
    throw err;
  }

  return null;
}
