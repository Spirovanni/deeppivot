import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { db } from '@/src/db';
import { usersTable } from '@/src/db/schema';
import { eq } from 'drizzle-orm';
import { initializeJobBoard } from '@/src/lib/actions/job-board';

export async function GET() {
  try {
    const users = await db.select().from(usersTable);
    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const user = await currentUser();

  try {
    let body: Record<string, unknown> = {};
    try {
      body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const firstName = typeof body.firstName === 'string' ? body.firstName : '';
    const lastName = typeof body.lastName === 'string' ? body.lastName : '';
    const name = typeof body.name === 'string' && body.name.trim()
      ? body.name.trim()
      : `${firstName} ${lastName}`.trim();
    const age = typeof body.age === 'number' ? body.age : 25;
    const clerkId = typeof body.clerkId === 'string' ? body.clerkId : '';
    const email = typeof body.email === 'string' && body.email.trim()
      ? body.email.trim()
      : clerkId ? `${clerkId}@clerk.placeholder` : '';

    if (!clerkId) {
      return NextResponse.json(
        { error: 'Missing required field: clerkId' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db.select().from(usersTable).where(eq(usersTable.clerkId, clerkId));
    
    if (existingUser.length > 0) {
      console.log('User already exists:', existingUser[0]);
      return NextResponse.json(existingUser[0], { status: 200 });
    }

    const [newUser] = await db
      .insert(usersTable)
      .values({
        clerkId,
        firstName,
        lastName,
        name,
        age,
        email,
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
      .returning();

    if (!newUser) {
      const [existing] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.clerkId, clerkId));
      if (existing) return NextResponse.json(existing, { status: 200 });
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }

    console.log('User created successfully:', newUser);

    try {
      await initializeJobBoard(newUser.id);
      console.log(`Initialized job board for user: ${newUser.id}`);
    } catch (boardError) {
      console.error('Failed to initialize job board:', boardError);
    }

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error('Detailed error creating user:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      error
    });
    
    // Check for specific database errors
    if (error instanceof Error) {
      if (error.message.includes('duplicate key') || error.message.includes('unique constraint')) {
        return NextResponse.json(
          { error: 'User with this email or clerkId already exists' },
          { status: 409 }
        );
      }
      
      if (error.message.includes('not null constraint') || error.message.includes('violates not-null')) {
        return NextResponse.json(
          { error: 'Missing required database fields', details: error.message },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to create user', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, firstName, lastName, name, age, email, clerkId } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Missing required field: id' },
        { status: 400 }
      );
    }

    const updatedUser = await db
      .update(usersTable)
      .set({ firstName, lastName, name, age, email, clerkId })
      .where(eq(usersTable.id, id))
      .returning();

    if (updatedUser.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedUser[0]);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Missing required parameter: id' },
        { status: 400 }
      );
    }

    const deletedUser = await db
      .delete(usersTable)
      .where(eq(usersTable.id, parseInt(id)))
      .returning();

    if (deletedUser.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
} 