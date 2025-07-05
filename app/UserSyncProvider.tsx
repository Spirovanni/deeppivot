/**
 * UserSyncProvider Component
 * 
 * This component is responsible for automatically syncing user data from Clerk
 * to our Neon Database when users sign in to the application.
 * 
 * Purpose:
 * - Ensures user data is always up-to-date in our database
 * - Handles client-side user synchronization on sign-in
 * - Works in conjunction with Clerk webhooks for comprehensive user management
 * 
 * How it works:
 * 1. Monitors Clerk user state changes using useUser hook
 * 2. When a user signs in (user becomes loaded), automatically syncs their data
 * 3. Sends user information to our /api/sync-users endpoint
 * 4. Creates or updates user record in Neon Database
 * 
 * Data synced:
 * - Clerk ID (unique identifier)
 * - First name and last name (separate fields)
 * - Full name (constructed from firstName/lastName or fallback to email)
 * - Email address
 * - Email verification status
 */

"use client";

import React, { useEffect } from "react";
import { useUser } from "@clerk/nextjs";

/**
 * Syncs user data from Clerk to our Neon Database
 * 
 * @param user - Clerk user object containing user information
 * 
 * This function:
 * - Extracts relevant user data from Clerk user object
 * - Sends a POST request to /api/sync-users endpoint
 * - Syncs firstName and lastName separately plus combined name
 * - Handles name construction with fallbacks (fullName -> firstName + lastName -> email)
 * - Includes email verification status from Clerk
 */
async function syncUserToDatabase(user: any) {
  try {
    const response = await fetch('/api/sync-users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        clerkId: user.id, // Unique Clerk identifier
        firstName: user.firstName || '', // First name from Clerk
        lastName: user.lastName || '', // Last name from Clerk
        name: user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.primaryEmailAddress?.emailAddress, // Name with fallbacks
        email: user.primaryEmailAddress?.emailAddress, // Primary email
        isEmailVerified: user.primaryEmailAddress?.verification?.status === 'verified', // Email verification status
      }),
    });

    if (!response.ok) {
      console.error('Failed to sync user to database');
    }
  } catch (error) {
    console.error('Error syncing user to database:', error);
  }
}

/**
 * UserSyncProvider Component
 * 
 * A React provider component that wraps the application and automatically
 * syncs user data when they sign in.
 * 
 * @param children - React children to render
 * 
 * Implementation details:
 * - Uses useUser hook to monitor Clerk authentication state
 * - Triggers sync when user becomes loaded (sign-in complete)
 * - Runs only once per user session using useEffect dependencies
 * - Transparent to child components (renders children without modification)
 */
function UserSyncProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();

  useEffect(() => {
    // Only sync when:
    // 1. Clerk has finished loading user data (isLoaded = true)
    // 2. User is authenticated (user object exists)
    if (isLoaded && user) {
      // Sync user data to database when user is loaded
      syncUserToDatabase(user);
    }
  }, [isLoaded, user]); // Re-run if user state changes

  // Render children without any wrapper elements
  return <>{children}</>;
}

export default UserSyncProvider; 