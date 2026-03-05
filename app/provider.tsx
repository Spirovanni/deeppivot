"use client";
import React, { useEffect, useState } from "react";
import { ClerkProvider, useUser } from "@clerk/nextjs";
import { Toaster } from "react-hot-toast";
import UserSyncProvider from "./UserSyncProvider";
import { UserDetailContext } from "@/context/UserDetailContext";
import { QueryProvider } from "./QueryProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { PHProvider } from "@/src/lib/posthog";
import { usePathname, useSearchParams } from "next/navigation";
import { usePostHog } from "posthog-js/react";
import { Suspense } from "react";


function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const posthog = usePostHog();

  useEffect(() => {
    if (pathname && posthog) {
      const url =
        window.location.origin + pathname +
        (searchParams?.toString() ? `?${searchParams.toString()}` : "");
      posthog.capture("$pageview", { $current_url: url });
    }
  }, [pathname, searchParams, posthog]);

  return null;
}

export type UsersDetail = {
  clerkId: string,
  firstName: string,
  lastName: string,
  credits: number,
  name: string,
  age: number,
  email: string
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
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clerkId: user.id,
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          name: user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          age: 25, // Default age since Clerk does not provide this
          email: user.primaryEmailAddress?.emailAddress || '',
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('User creation/sync successful:', data);
    } catch (error) {
      console.warn('Failed to create/sync user - continuing without database sync:', {
        message: error instanceof Error ? error.message : 'Unknown error',
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
    <QueryProvider>
      <UserSyncProvider>
        <UserDetailContext.Provider value={{ userDetail, setUserDetail }}>
          <Suspense fallback={null}>
            <PageViewTracker />
          </Suspense>
          {children}
          <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
        </UserDetailContext.Provider>
      </UserSyncProvider>
    </QueryProvider>
  );
}

function Provider({
  children,
  isProduction,
}: {
  children: React.ReactNode;
  isProduction?: boolean;
}) {
  return (
    <PHProvider>
      <ThemeProvider defaultTheme="system" storageKey="deeppivot-theme">
        <ClerkProvider
          {...(isProduction ? {
            clerkJSUrl: "/api/clerk-js",
            proxyUrl: "/api/clerk-proxy"
          } : {})}
        >
          <InnerProvider>
            {children}
          </InnerProvider>
        </ClerkProvider>
      </ThemeProvider>
    </PHProvider>
  );
}

export default Provider;