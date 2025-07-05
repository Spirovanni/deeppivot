import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { db } from '@/src/db';
import { usersTable } from '@/src/db/schema';
import { eq } from 'drizzle-orm';

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  if (!webhookSecret) {
    throw new Error('Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local');
  }

  // Get the headers
  const headerPayload = headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', {
      status: 400,
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret.
  const wh = new Webhook(webhookSecret);

  let evt: any;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    });
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error occured', {
      status: 400,
    });
  }

  // Handle the webhook
  const eventType = evt.type;
  
  console.log(`Webhook with an ID of ${evt.data.id} and type of ${eventType}`);
  console.log('Webhook body:', body);

  if (eventType === 'user.created' || eventType === 'user.updated') {
    const { id, email_addresses, first_name, last_name, image_url, created_at } = evt.data;
    
    const primaryEmail = email_addresses.find((email: any) => email.id === evt.data.primary_email_address_id);
    
    if (!primaryEmail) {
      console.error('No primary email found for user');
      return new Response('No primary email found', { status: 400 });
    }

    try {
      // Check if user already exists
      const existingUser = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, primaryEmail.email_address))
        .limit(1);

      const userData = {
        name: `${first_name || ''} ${last_name || ''}`.trim() || primaryEmail.email_address,
        email: primaryEmail.email_address,
        age: 25, // Default age since Clerk doesn't provide this
        isEmailVerified: primaryEmail.verification?.status === 'verified',
        // Add any other fields you want to sync
      };

      if (existingUser.length === 0) {
        // Create new user
        await db.insert(usersTable).values(userData);
        console.log(`Created new user: ${primaryEmail.email_address}`);
      } else {
        // Update existing user
        await db
          .update(usersTable)
          .set({
            name: userData.name,
            isEmailVerified: userData.isEmailVerified,
            updatedAt: new Date(),
          })
          .where(eq(usersTable.email, primaryEmail.email_address));
        console.log(`Updated user: ${primaryEmail.email_address}`);
      }
    } catch (error) {
      console.error('Error syncing user to database:', error);
      return new Response('Error syncing user', { status: 500 });
    }
  }

  return new Response('', { status: 200 });
} 