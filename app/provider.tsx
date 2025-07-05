import React from "react";
import axios from "axios";
import { ClerkProvider } from "@clerk/nextjs";
import UserSyncProvider from "./UserSyncProvider";

/**
 * CreateNewUser Function
 * 
 * Creates a new user in the database using the /api/users endpoint.
 * This is useful for admin functions or manual user creation.
 * 
 * @param userData - User data to create in the database
 * @returns Promise with the API response
 */
const CreateNewUser = async (userData: {
  clerkId: string;
  firstName: string;
  lastName: string;
  name: string;
  age: number;
  email: string;
}) => {
  try {
    const result = await axios.post('/api/users', userData);
    console.log('User created successfully:', result.data);
    return result.data;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

/**
 * Provider Component
 * 
 * Main application provider that wraps the app with:
 * - ClerkProvider for authentication
 * - UserSyncProvider for automatic user synchronization
 * - CreateNewUser function available globally
 * 
 * This combines automatic user sync with manual user creation capabilities.
 */
function Provider({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <UserSyncProvider>
        {children}
      </UserSyncProvider>
    </ClerkProvider>
  );
}

// Export both the Provider and the CreateNewUser function
export default Provider;
export { CreateNewUser };