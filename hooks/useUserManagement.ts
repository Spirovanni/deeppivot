import { useState } from 'react';
import { useCurrentUser } from './useCurrentUser';
import axios from 'axios';

// Duplicate the CreateNewUser function here to avoid circular imports
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

interface CreateUserData {
  clerkId: string;
  firstName: string;
  lastName: string;
  name: string;
  age: number;
  email: string;
}

interface UseUserManagementReturn {
  // Current user functionality
  currentUser: ReturnType<typeof useCurrentUser>['user'];
  loading: boolean;
  error: string | null;
  refetchCurrentUser: () => Promise<void>;
  
  // User creation functionality
  createUser: (userData: CreateUserData) => Promise<any>;
  creating: boolean;
  createError: string | null;
}

/**
 * Comprehensive User Management Hook
 * 
 * This hook combines all user-related functionality:
 * - Current user data retrieval (from database)
 * - User creation capabilities
 * - Loading and error states for both operations
 * 
 * Perfect for admin panels, user management interfaces, or any component
 * that needs both read and write access to user data.
 * 
 * @returns Object with current user data and user creation functions
 */
export function useUserManagement(): UseUserManagementReturn {
  const { 
    user: currentUser, 
    loading, 
    error, 
    refetch: refetchCurrentUser 
  } = useCurrentUser();
  
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const createUser = async (userData: CreateUserData) => {
    try {
      setCreating(true);
      setCreateError(null);
      
      const result = await CreateNewUser(userData);
      
      // Optionally refetch current user data if the created user is the current user
      if (userData.clerkId === currentUser?.clerkId) {
        await refetchCurrentUser();
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create user';
      setCreateError(errorMessage);
      throw err;
    } finally {
      setCreating(false);
    }
  };

  return {
    // Current user functionality
    currentUser,
    loading,
    error,
    refetchCurrentUser,
    
    // User creation functionality
    createUser,
    creating,
    createError,
  };
} 