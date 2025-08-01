"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { ClerkProvider, useUser } from "@clerk/nextjs";
import UserSyncProvider from "./UserSyncProvider";
import { UserDetailContext } from "@/context/UserDetailContext";


export type UsersDetail={
    clerkId:string,
    firstName:string,
    lastName:string,
    credits:number,
    name:string,
    age:number,
    email:string
}
/**
 * Provider Component
 *
 * Main application provider that wraps the app with:
 * - ClerkProvider: Provides authentication context for the entire app using Clerk.
 * - UserSyncProvider: Handles automatic user synchronization logic.
 * - UserDetailContext.Provider: Supplies user detail state and updater (userDetail, setUserDetail) to all children.
 * - Automatic backend user creation: Ensures a user record is created in the backend database when a user logs in (if not already present).
 *
 * This component ensures that all children have access to authentication, user synchronization, user detail context, and backend user creation logic.
 */
function InnerProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const [userDetail, setUserDetail] = useState<any>();

  // Define CreateNewUser inside Provider
  const CreateNewUser = async () => {
    if (!user) return;
    
    try {
      const response = await axios.post('/api/users', {
        clerkId: user.id,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        name: user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        age: 25, // Default age since Clerk does not provide this
        email: user.primaryEmailAddress?.emailAddress || '',
      });
      
      console.log('User creation/sync successful:', response.data);
    } catch (error) {
      console.warn('Failed to create/sync user - continuing without database sync:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        response: axios.isAxiosError(error) ? error.response?.data : undefined,
        status: axios.isAxiosError(error) ? error.response?.status : undefined
      });
      
      // Don't throw the error - just log it to avoid breaking the app
      // The user can still use the app even if backend sync fails
    }
  };

  useEffect(() => {
    if (user) {
      CreateNewUser();
    }
  }, [user]);

  return (
    <UserSyncProvider>
      <UserDetailContext.Provider value={{userDetail,setUserDetail}}>
        {children}
      </UserDetailContext.Provider>
    </UserSyncProvider>
  );
}

function Provider({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <InnerProvider>
        {children}
      </InnerProvider>
    </ClerkProvider>
  );
}

export default Provider;