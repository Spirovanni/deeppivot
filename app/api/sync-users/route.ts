import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { db } from '@/src/db';
import { usersTable } from '@/src/db/schema';
import { eq } from 'drizzle-orm';
import { inngest } from '@/src/inngest/client';

async function syncSingleUser(userData: {
  clerkId: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  isEmailVerified: boolean;
}) {
  try {
    const existingUser = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.clerkId, userData.clerkId))
      .limit(1);

    const userRecord = {
      clerkId: userData.clerkId,
      firstName: userData.firstName,
      lastName: userData.lastName,
      name: userData.name,
      email: userData.email,
      age: 25,
      isEmailVerified: userData.isEmailVerified,
    };

    if (existingUser.length === 0) {
      try {
        await db
          .insert(usersTable)
          .values(userRecord)
          .onConflictDoUpdate({
            target: usersTable.clerkId,
            set: {
              firstName: userRecord.firstName,
              lastName: userRecord.lastName,
              name: userRecord.name,
              email: userRecord.email,
              isEmailVerified: userRecord.isEmailVerified,
              updatedAt: new Date(),
            },
          });
      } catch (insertErr) {
        const [retry] = await db
          .select()
          .from(usersTable)
          .where(eq(usersTable.clerkId, userData.clerkId))
          .limit(1);
        if (retry) {
          return NextResponse.json({
            message: 'User already exists (race)',
            status: 'created',
            user: userRecord,
          });
        }
        throw insertErr;
      }

      // Fire welcome email via Inngest (non-blocking)
      inngest.send({
        name: "user/created",
        data: { userId: userData.clerkId, email: userData.email, name: userData.name },
      }).catch((err: unknown) => console.error("[inngest] Failed to send user/created:", err));

      return NextResponse.json({
        message: 'User created successfully',
        status: 'created',
        user: userRecord,
      });
    } else {
      await db
        .update(usersTable)
        .set({
          firstName: userRecord.firstName,
          lastName: userRecord.lastName,
          name: userRecord.name,
          email: userRecord.email,
          isEmailVerified: userRecord.isEmailVerified,
          updatedAt: new Date(),
        })
        .where(eq(usersTable.clerkId, userData.clerkId));

      return NextResponse.json({
        message: 'User updated successfully',
        status: 'updated',
        user: userRecord,
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
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: Record<string, unknown> = {};
    try {
      body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    } catch {
      // Empty or invalid JSON
    }

    // Single user sync from client (UserSyncProvider)
    if (body.clerkId && typeof body.clerkId === 'string') {
      const email = typeof body.email === 'string' && body.email.trim()
        ? body.email.trim()
        : `${body.clerkId}@clerk.placeholder`;
      return await syncSingleUser({
        clerkId: body.clerkId,
        firstName: typeof body.firstName === 'string' ? body.firstName : '',
        lastName: typeof body.lastName === 'string' ? body.lastName : '',
        name: typeof body.name === 'string' && body.name.trim()
          ? body.name.trim()
          : `${body.firstName || ''} ${body.lastName || ''}`.trim() || email,
        email,
        isEmailVerified: body.isEmailVerified === true,
      });
    }

    // Bulk sync (admin path) - requires Clerk backend API
    const client = await clerkClient();
    const clerkUsers = await client.users.getUserList({ limit: 100 });

    const syncResults = [];

    for (const clerkUser of clerkUsers.data) {
      const primaryEmail = clerkUser.emailAddresses.find(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (email: any) => email.id === clerkUser.primaryEmailAddressId
      );

      if (!primaryEmail) {
        syncResults.push({ clerkId: clerkUser.id, email: 'No primary email', status: 'skipped', reason: 'No primary email found' });
        continue;
      }

      try {
        const existingUser = await db
          .select()
          .from(usersTable)
          .where(eq(usersTable.clerkId, clerkUser.id))
          .limit(1);

        const userData = {
          clerkId: clerkUser.id,
          firstName: clerkUser.firstName || '',
          lastName: clerkUser.lastName || '',
          name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || primaryEmail.emailAddress,
          email: primaryEmail.emailAddress,
          age: 25,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          isEmailVerified: (primaryEmail as any).verification?.status === 'verified',
          createdAt: new Date(clerkUser.createdAt),
          updatedAt: new Date(clerkUser.updatedAt),
        };

        if (existingUser.length === 0) {
          await db.insert(usersTable).values(userData);
          syncResults.push({ clerkId: clerkUser.id, email: primaryEmail.emailAddress, status: 'created', reason: 'New user created' });
        } else {
          await db
            .update(usersTable)
            .set({
              firstName: userData.firstName,
              lastName: userData.lastName,
              name: userData.name,
              email: userData.email,
              isEmailVerified: userData.isEmailVerified,
              updatedAt: new Date(),
            })
            .where(eq(usersTable.clerkId, clerkUser.id));

          syncResults.push({ clerkId: clerkUser.id, email: primaryEmail.emailAddress, status: 'updated', reason: 'Existing user updated' });
        }
      } catch (error) {
        console.error(`Error syncing user ${clerkUser.id}:`, error);
        syncResults.push({ clerkId: clerkUser.id, email: primaryEmail.emailAddress, status: 'error', reason: error instanceof Error ? error.message : 'Unknown error' });
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
      },
    });
  } catch (error) {
    console.error('Error in user sync:', error);
    return NextResponse.json(
      { error: 'Failed to sync users', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}