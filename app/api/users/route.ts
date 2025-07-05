import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/src/db';
import { usersTable } from '@/src/db/schema';
import { eq } from 'drizzle-orm';

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
  try {
    const body = await request.json();
    const { firstName, lastName, name, age, email, clerkId } = body;

    if (!firstName || !lastName || !name || !age || !email || !clerkId) {
      return NextResponse.json(
        { error: 'Missing required fields: firstName, lastName, name, age, email, clerkId' },
        { status: 400 }
      );
    }

    const newUser = await db.insert(usersTable).values({
      clerkId,
      firstName,
      lastName,
      name,
      age,
      email,
    }).returning();

    return NextResponse.json(newUser[0], { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
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