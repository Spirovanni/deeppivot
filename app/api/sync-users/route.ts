import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { db } from '@/src/db';
import { usersTable } from '@/src/db/schema';
import { eq } from 'drizzle-orm';

async function syncSingleUser(userData: {
  clerkId: string;
  name: string;
  email: string;
  isEmailVerified: boolean;
}) {
  try {
    // Check if user already exists by Clerk ID
    const existingUser = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.clerkId, userData.clerkId))
      .limit(1);

    const userRecord = {
      clerkId: userData.clerkId,
      name: userData.name,
      email: userData.email,
      age: 25, // Default age
      isEmailVerified: userData.isEmailVerified,
    };

    if (existingUser.length === 0) {
      // Create new user
      await db.insert(usersTable).values(userRecord);
      return NextResponse.json({
        message: 'User created successfully',
        status: 'created',
        user: userRecord
      });
    } else {
      // Update existing user
      await db
        .update(usersTable)
        .set({
          name: userRecord.name,
          email: userRecord.email,
          isEmailVerified: userRecord.isEmailVerified,
          updatedAt: new Date(),
        })
        .where(eq(usersTable.clerkId, userData.clerkId));
      
      return NextResponse.json({
        message: 'User updated successfully',
        status: 'updated',
        user: userRecord
      });
    }
  } catch (error) {
    console.error('Error syncing single user:', error);
    return NextResponse.json(
      { error: 'Failed to sync user', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Check if user is authenticated
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if this is a single user sync request (from client)
    const body = await req.json();
    if (body.clerkId && body.email) {
      return await syncSingleUser(body);
    }

    // Get all users from Clerk - clerkClient is a function that returns a promise
    const client = await clerkClient();
    const clerkUsers = await client.users.getUserList({
      limit: 100, // Adjust as needed
    });

    const syncResults = [];

    for (const clerkUser of clerkUsers.data) {
      const primaryEmail = clerkUser.emailAddresses.find(
        (email: any) => email.id === clerkUser.primaryEmailAddressId
      );

      if (!primaryEmail) {
        syncResults.push({
          clerkId: clerkUser.id,
          email: 'No primary email',
          status: 'skipped',
          reason: 'No primary email found'
        });
        continue;
      }

      try {
        // Check if user already exists by Clerk ID
        const existingUser = await db
          .select()
          .from(usersTable)
          .where(eq(usersTable.clerkId, clerkUser.id))
          .limit(1);

        const userData = {
          clerkId: clerkUser.id,
          name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || primaryEmail.emailAddress,
          email: primaryEmail.emailAddress,
          age: 25, // Default age
          isEmailVerified: primaryEmail.verification?.status === 'verified',
          createdAt: new Date(clerkUser.createdAt),
          updatedAt: new Date(clerkUser.updatedAt),
        };

        if (existingUser.length === 0) {
          // Create new user
          await db.insert(usersTable).values(userData);
          syncResults.push({
            clerkId: clerkUser.id,
            email: primaryEmail.emailAddress,
            status: 'created',
            reason: 'New user created'
          });
        } else {
          // Update existing user
          await db
            .update(usersTable)
            .set({
              name: userData.name,
              email: userData.email,
              isEmailVerified: userData.isEmailVerified,
              updatedAt: new Date(),
            })
            .where(eq(usersTable.clerkId, clerkUser.id));
          
          syncResults.push({
            clerkId: clerkUser.id,
            email: primaryEmail.emailAddress,
            status: 'updated',
            reason: 'Existing user updated'
          });
        }
      } catch (error) {
        console.error(`Error syncing user ${clerkUser.id}:`, error);
        syncResults.push({
          clerkId: clerkUser.id,
          email: primaryEmail.emailAddress,
          status: 'error',
          reason: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      message: 'User sync completed',
      totalUsers: clerkUsers.data.length,
      results: syncResults,
      summary: {
        created: syncResults.filter(r => r.status === 'created').length,
        updated: syncResults.filter(r => r.status === 'updated').length,
        skipped: syncResults.filter(r => r.status === 'skipped').length,
        errors: syncResults.filter(r => r.status === 'error').length,
      }
    });

  } catch (error) {
    console.error('Error in user sync:', error);
    return NextResponse.json(
      { error: 'Failed to sync users', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 