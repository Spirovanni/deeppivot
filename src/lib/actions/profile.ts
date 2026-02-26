"use server";

import { db } from "@/src/db";
import { usersTable } from "@/src/db/schema";
import { eq, isNull } from "drizzle-orm";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { uploadToR2 } from "@/src/lib/storage";

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getAuthenticatedDbUser() {
  const clerkUser = await currentUser();
  if (!clerkUser?.id) throw new Error("Not authenticated");

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkId, clerkUser.id))
    .limit(1);

  if (!user || user.deletedAt) throw new Error("User not found");
  return user;
}

// ─── Get profile ──────────────────────────────────────────────────────────────

export interface UserProfile {
  id: number;
  clerkId: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  bio: string | null;
  phone: string | null;
  pronouns: string | null;
  linkedinUrl: string | null;
  role: string;
  isPremium: boolean;
  createdAt: Date;
}

export async function getUserProfile(): Promise<UserProfile> {
  const user = await getAuthenticatedDbUser();

  return {
    id: user.id,
    clerkId: user.clerkId,
    firstName: user.firstName,
    lastName: user.lastName,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl ?? null,
    bio: user.bio ?? null,
    phone: user.phone ?? null,
    pronouns: user.pronouns ?? null,
    linkedinUrl: user.linkedinUrl ?? null,
    role: user.role,
    isPremium: user.isPremium,
    createdAt: user.createdAt,
  };
}

// ─── Update profile ───────────────────────────────────────────────────────────

export interface ProfileUpdateInput {
  firstName?: string;
  lastName?: string;
  bio?: string;
  phone?: string;
  pronouns?: string;
  linkedinUrl?: string;
}

export async function updateProfile(input: ProfileUpdateInput): Promise<void> {
  const user = await getAuthenticatedDbUser();

  const firstName = input.firstName?.trim();
  const lastName = input.lastName?.trim();

  await db
    .update(usersTable)
    .set({
      ...(firstName ? { firstName, name: `${firstName} ${(lastName ?? user.lastName).trim()}`.trim() } : {}),
      ...(lastName ? { lastName, name: `${(firstName ?? user.firstName).trim()} ${lastName}`.trim() } : {}),
      ...(input.bio !== undefined ? { bio: input.bio.trim() || null } : {}),
      ...(input.phone !== undefined ? { phone: input.phone.trim() || null } : {}),
      ...(input.pronouns !== undefined ? { pronouns: input.pronouns.trim() || null } : {}),
      ...(input.linkedinUrl !== undefined ? { linkedinUrl: input.linkedinUrl.trim() || null } : {}),
      updatedAt: new Date(),
    })
    .where(eq(usersTable.id, user.id));

  revalidatePath("/dashboard/settings/profile");
}

// ─── Avatar upload ────────────────────────────────────────────────────────────

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_AVATAR_BYTES = 5 * 1024 * 1024; // 5 MB

export async function uploadAvatar(formData: FormData): Promise<{ avatarUrl: string }> {
  const user = await getAuthenticatedDbUser();

  const file = formData.get("avatar") as File | null;
  if (!file) throw new Error("No file provided");
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error("Invalid file type. Please upload a JPEG, PNG, WebP, or GIF.");
  }
  if (file.size > MAX_AVATAR_BYTES) {
    throw new Error("File too large. Maximum avatar size is 5 MB.");
  }

  const ext = file.type.split("/")[1] ?? "jpg";
  const key = `avatars/user-${user.id}-${Date.now()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const url = await uploadToR2(key, buffer, file.type);

  await db
    .update(usersTable)
    .set({ avatarUrl: url, updatedAt: new Date() })
    .where(eq(usersTable.id, user.id));

  revalidatePath("/dashboard/settings/profile");
  return { avatarUrl: url };
}

// ─── Soft delete account ──────────────────────────────────────────────────────

export async function softDeleteAccount(): Promise<void> {
  const user = await getAuthenticatedDbUser();

  await db
    .update(usersTable)
    .set({
      deletedAt: new Date(),
      isDeleted: true,
      isActive: false,
      updatedAt: new Date(),
    })
    .where(eq(usersTable.id, user.id));

  // Note: caller should also revoke the Clerk session after this action.
}

// ─── Soft delete interview session ────────────────────────────────────────────

export async function softDeleteInterviewSession(sessionId: number): Promise<void> {
  const user = await getAuthenticatedDbUser();

  const { interviewSessionsTable } = await import("@/src/db/schema");

  const [session] = await db
    .select({ id: interviewSessionsTable.id, userId: interviewSessionsTable.userId })
    .from(interviewSessionsTable)
    .where(eq(interviewSessionsTable.id, sessionId))
    .limit(1);

  if (!session) throw new Error("Session not found");
  if (session.userId !== user.id) throw new Error("Not authorized to delete this session");

  await db
    .update(interviewSessionsTable)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(eq(interviewSessionsTable.id, sessionId));

  revalidatePath("/dashboard/interviews");
}

// ─── Soft delete career milestone ─────────────────────────────────────────────

export async function softDeleteMilestone(milestoneId: number): Promise<void> {
  const user = await getAuthenticatedDbUser();

  const { careerMilestonesTable } = await import("@/src/db/schema");

  const [milestone] = await db
    .select({ id: careerMilestonesTable.id, userId: careerMilestonesTable.userId })
    .from(careerMilestonesTable)
    .where(eq(careerMilestonesTable.id, milestoneId))
    .limit(1);

  if (!milestone) throw new Error("Milestone not found");
  if (milestone.userId !== user.id) throw new Error("Not authorized to delete this milestone");

  await db
    .update(careerMilestonesTable)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(eq(careerMilestonesTable.id, milestoneId));

  revalidatePath("/dashboard/career-plan");
}
