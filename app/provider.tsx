import React from "react";
import { ClerkProvider } from "@clerk/nextjs";
import UserSyncProvider from "./UserSyncProvider";

function Provider({ children }: { children: React.ReactNode }) {
    return (
        <ClerkProvider>
            <UserSyncProvider>
                {children}
            </UserSyncProvider>
        </ClerkProvider>
    )
}

export default Provider;