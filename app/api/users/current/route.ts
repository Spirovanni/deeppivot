import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/src/db';
import { usersTable } from '@/src/db/schema';
import { eq } from 'drizzle-orm';

/**
 * GET /api/users/current
 * 
 * Returns the current authenticated user's information from the database.
 * Uses the Clerk user ID to fetch the corresponding user record.
 * 
 * @returns User object with all database fields or error response
 */
export async function GET() {
  try {
    // Get the current user's Clerk ID from the session
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized - No active session' },
        { status: 401 }
      );
    }

    // Fetch the user from the database using their Clerk ID
    const currentUser = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.clerkId, userId))
      .limit(1);

    if (currentUser.length === 0) {
      return NextResponse.json(
        { error: 'User not found in database' },
        { status: 404 }
      );
    }

    // Return the user data (excluding sensitive fields if needed)
    const userData = currentUser[0];
    
    return NextResponse.json({
      id: userData.id,
      clerkId: userData.clerkId,
      firstName: userData.firstName,
      lastName: userData.lastName,
      name: userData.name,
      email: userData.email,
      age: userData.age,
      role: userData.role,
      status: userData.status,
      isEmailVerified: userData.isEmailVerified,
      isPremium: userData.isPremium,
      credits: userData.credits,
      creditsUsed: userData.creditsUsed,
      creditsRemaining: userData.creditsRemaining,
      createdAt: userData.createdAt,
      updatedAt: userData.updatedAt,
    });

  } catch (error) {
    console.error('Error fetching current user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch current user' },
      { status: 500 }
    );
  }
} 