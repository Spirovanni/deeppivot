"use client";

import React, { useEffect } from "react";
import { useUser } from "@clerk/nextjs";

async function syncUserToDatabase(user: any) {
  try {
    const response = await fetch('/api/sync-users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        clerkId: user.id,
        name: user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.primaryEmailAddress?.emailAddress,
        email: user.primaryEmailAddress?.emailAddress,
        isEmailVerified: user.primaryEmailAddress?.verification?.status === 'verified',
      }),
    });

    if (!response.ok) {
      console.error('Failed to sync user to database');
    }
  } catch (error) {
    console.error('Error syncing user to database:', error);
  }
}

function UserSyncProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (isLoaded && user) {
      // Sync user data to database when user is loaded
      syncUserToDatabase(user);
    }
  }, [isLoaded, user]);

  return <>{children}</>;
}

export default UserSyncProvider; 