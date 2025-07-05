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
 * - ClerkProvider for authentication
 * - UserSyncProvider for automatic user synchronization
 * 
 * This combines automatic user sync with manual user creation capabilities.
 */
function InnerProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const [userDetail, setUserDetail] = useState<any>();

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