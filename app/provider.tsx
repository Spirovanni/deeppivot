import React, { useEffect } from "react";
import axios from "axios";
import { ClerkProvider, useUser } from "@clerk/nextjs";
import UserSyncProvider from "./UserSyncProvider";

/**
 * Provider Component
 * 
 * Main application provider that wraps the app with:
 * - ClerkProvider for authentication
 * - UserSyncProvider for automatic user synchronization
 * 
 * This combines automatic user sync with manual user creation capabilities.
 */
function Provider({ children }: { children: React.ReactNode }) {
  const { user } = useUser();

  // Define CreateNewUser inside Provider
  const CreateNewUser = async () => {
    if (!user) return;
    await axios.post('/api/users', {
      clerkId: user.id,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      name: user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      age: 25, // Default age since Clerk does not provide this
      email: user.primaryEmailAddress?.emailAddress || '',
    });
  };

  useEffect(() => {
    if (user) {
      CreateNewUser();
    }
  }, [user]);

  return (
    <ClerkProvider>
      <UserSyncProvider>
        {children}
      </UserSyncProvider>
    </ClerkProvider>
  );
}

export default Provider;