"use client";

import React from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useUser } from '@clerk/nextjs';

/**
 * UserProfile Component
 * 
 * Example component demonstrating how to use the useCurrentUser hook
 * to display user information from the database.
 * 
 * This component shows:
 * - Loading states
 * - Error handling
 * - User data from both Clerk and database
 * - Manual refetch functionality
 */
export function UserProfile() {
  const { isSignedIn } = useUser();
  const { user: dbUser, loading, error, refetch } = useCurrentUser();

  if (!isSignedIn) {
    return (
      <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
        <p className="text-gray-600 dark:text-gray-400">Please sign in to view your profile.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-300 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-300 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 border rounded-lg bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-red-800 dark:text-red-200 font-medium">Error Loading Profile</h3>
            <p className="text-red-600 dark:text-red-300 text-sm">{error}</p>
          </div>
          <button
            onClick={refetch}
            className="px-3 py-1 bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200 rounded text-sm hover:bg-red-200 dark:hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!dbUser) {
    return (
      <div className="p-4 border rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-yellow-800 dark:text-yellow-200 font-medium">Profile Not Found</h3>
            <p className="text-yellow-600 dark:text-yellow-300 text-sm">
              Your profile hasn't been synced to the database yet.
            </p>
          </div>
          <button
            onClick={refetch}
            className="px-3 py-1 bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 rounded text-sm hover:bg-yellow-200 dark:hover:bg-yellow-700 transition-colors"
          >
            Sync Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 border rounded-lg bg-white dark:bg-gray-800 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          User Profile
        </h2>
        <button
          onClick={refetch}
          className="px-3 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded text-sm hover:bg-blue-200 dark:hover:bg-blue-700 transition-colors"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Name</label>
            <p className="text-gray-900 dark:text-gray-100">
              {dbUser.firstName} {dbUser.lastName}
            </p>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</label>
            <p className="text-gray-900 dark:text-gray-100">{dbUser.email}</p>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Role</label>
            <p className="text-gray-900 dark:text-gray-100 capitalize">{dbUser.role}</p>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</label>
            <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
              dbUser.status === 'active' 
                ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100'
            }`}>
              {dbUser.status}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Credits</label>
            <p className="text-gray-900 dark:text-gray-100">
              {dbUser.creditsRemaining} / {dbUser.credits}
            </p>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Premium</label>
            <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
              dbUser.isPremium 
                ? 'bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100'
                : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100'
            }`}>
              {dbUser.isPremium ? 'Premium' : 'Free'}
            </span>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Email Verified</label>
            <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
              dbUser.isEmailVerified 
                ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
            }`}>
              {dbUser.isEmailVerified ? 'Verified' : 'Unverified'}
            </span>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Member Since</label>
            <p className="text-gray-900 dark:text-gray-100">
              {new Date(dbUser.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          <p>Database ID: {dbUser.id}</p>
          <p>Clerk ID: {dbUser.clerkId}</p>
          <p>Last Updated: {new Date(dbUser.updatedAt).toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
} 