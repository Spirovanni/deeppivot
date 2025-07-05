import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';

interface DatabaseUser {
  id: number;
  clerkId: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  age: number;
  role: string;
  status: string;
  isEmailVerified: boolean;
  isPremium: boolean;
  credits: number;
  creditsUsed: number;
  creditsRemaining: number;
  createdAt: string;
  updatedAt: string;
}

interface UseCurrentUserReturn {
  user: DatabaseUser | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Custom hook to fetch the current user's information from the database
 * 
 * This hook:
 * - Automatically fetches user data when the user is signed in
 * - Provides loading and error states
 * - Includes a refetch function for manual updates
 * - Returns null when user is not authenticated
 * 
 * @returns Object containing user data, loading state, error state, and refetch function
 */
export function useCurrentUser(): UseCurrentUserReturn {
  const { isSignedIn, isLoaded } = useUser();
  const [user, setUser] = useState<DatabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCurrentUser = async () => {
    if (!isSignedIn) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/users/current');
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Not authenticated');
        }
        if (response.status === 404) {
          throw new Error('User not found in database');
        }
        throw new Error('Failed to fetch user data');
      }

      const userData = await response.json();
      setUser(userData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error fetching current user:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoaded) {
      fetchCurrentUser();
    }
  }, [isSignedIn, isLoaded]);

  return {
    user,
    loading,
    error,
    refetch: fetchCurrentUser,
  };
} 