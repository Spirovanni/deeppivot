"use client";

import React, { useState } from 'react';
import { useUserManagement } from '@/hooks/useUserManagement';
import { useUser } from '@clerk/nextjs';

/**
 * UserManagement Component
 * 
 * Comprehensive component demonstrating all user functionality:
 * - Display current user information from database
 * - Create new users manually
 * - Error handling and loading states
 * - Admin-style interface for user management
 */
export function UserManagement() {
  const { isSignedIn, user: clerkUser } = useUser();
  const {
    currentUser,
    loading,
    error,
    refetchCurrentUser,
    createUser,
    creating,
    createError
  } = useUserManagement();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    clerkId: '',
    firstName: '',
    lastName: '',
    name: '',
    age: 25,
    email: ''
  });

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createUser(formData);
      setShowCreateForm(false);
      setFormData({
        clerkId: '',
        firstName: '',
        lastName: '',
        name: '',
        age: 25,
        email: ''
      });
      alert('User created successfully!');
    } catch (err) {
      console.error('Failed to create user:', err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'age' ? parseInt(value) || 0 : value
    }));
  };

  // Auto-fill form with current Clerk user data
  const fillWithClerkData = () => {
    if (clerkUser) {
      setFormData({
        clerkId: clerkUser.id,
        firstName: clerkUser.firstName || '',
        lastName: clerkUser.lastName || '',
        name: clerkUser.fullName || `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim(),
        age: 25,
        email: clerkUser.primaryEmailAddress?.emailAddress || ''
      });
    }
  };

  if (!isSignedIn) {
    return (
      <div className="p-6 border rounded-lg bg-gray-50 dark:bg-gray-800">
        <p className="text-gray-600 dark:text-gray-400">Please sign in to access user management.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current User Section */}
      <div className="p-6 border rounded-lg bg-white dark:bg-gray-800 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Current User Profile
          </h2>
          <button
            onClick={refetchCurrentUser}
            disabled={loading}
            className="px-3 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded text-sm hover:bg-blue-200 dark:hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {loading && (
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2"></div>
            <div className="h-4 bg-gray-300 rounded w-2/3"></div>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
            <p className="text-red-600 dark:text-red-300 text-sm">{error}</p>
          </div>
        )}

        {currentUser && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Name:</span>
                <p className="text-gray-900 dark:text-gray-100">{currentUser.firstName} {currentUser.lastName}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Email:</span>
                <p className="text-gray-900 dark:text-gray-100">{currentUser.email}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Role:</span>
                <p className="text-gray-900 dark:text-gray-100 capitalize">{currentUser.role}</p>
              </div>
            </div>
            <div className="space-y-2">
              <div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Credits:</span>
                <p className="text-gray-900 dark:text-gray-100">{currentUser.creditsRemaining} / {currentUser.credits}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Status:</span>
                <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                  currentUser.status === 'active' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100'
                }`}>
                  {currentUser.status}
                </span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Premium:</span>
                <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                  currentUser.isPremium 
                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100'
                }`}>
                  {currentUser.isPremium ? 'Premium' : 'Free'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* User Creation Section */}
      <div className="p-6 border rounded-lg bg-white dark:bg-gray-800 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Create New User
          </h2>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
          >
            {showCreateForm ? 'Cancel' : 'Create User'}
          </button>
        </div>

        {createError && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
            <p className="text-red-600 dark:text-red-300 text-sm">{createError}</p>
          </div>
        )}

        {showCreateForm && (
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="flex justify-end mb-4">
              <button
                type="button"
                onClick={fillWithClerkData}
                className="px-3 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded text-sm hover:bg-blue-200 dark:hover:bg-blue-700 transition-colors"
              >
                Fill with my Clerk data
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Clerk ID
                </label>
                <input
                  type="text"
                  name="clerkId"
                  value={formData.clerkId}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Age
                </label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleInputChange}
                  required
                  min="1"
                  max="120"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create User'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
} 