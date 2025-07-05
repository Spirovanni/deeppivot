# User Management System Documentation

This document outlines the comprehensive user management system implemented in the Deep Pivot application, combining automatic user synchronization with manual user creation capabilities.

## 🏗️ Architecture Overview

The system consists of several interconnected components:

1. **Database Schema** - Neon PostgreSQL with firstName/lastName fields
2. **Automatic Sync** - UserSyncProvider for real-time user synchronization
3. **API Endpoints** - RESTful endpoints for user operations
4. **React Hooks** - Custom hooks for easy data access
5. **UI Components** - Ready-to-use components for user management

## 📊 Database Schema

### Users Table Structure
```sql
CREATE TABLE "users" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "clerkId" varchar(255) NOT NULL UNIQUE,
  "firstName" varchar(255) NOT NULL,
  "lastName" varchar(255) NOT NULL,
  "name" varchar(255) NOT NULL,
  "age" integer NOT NULL,
  "email" varchar(255) NOT NULL UNIQUE,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL,
  "role" varchar(255) DEFAULT 'user' NOT NULL,
  "status" varchar(255) DEFAULT 'active' NOT NULL,
  "isEmailVerified" boolean DEFAULT false NOT NULL,
  "isPremium" boolean DEFAULT false NOT NULL,
  "credits" integer DEFAULT 0 NOT NULL,
  "creditsUsed" integer DEFAULT 0 NOT NULL,
  "creditsRemaining" integer DEFAULT 0 NOT NULL,
  -- ... additional fields
);
```

## 🔄 Automatic User Synchronization

### UserSyncProvider Component
Located: `app/UserSyncProvider.tsx`

Automatically syncs user data from Clerk to the database when users sign in.

**Features:**
- ✅ Monitors Clerk authentication state
- ✅ Syncs firstName, lastName, email, and verification status
- ✅ Handles name fallbacks (fullName → firstName + lastName → email)
- ✅ Runs once per session with dependency tracking

**Usage:**
```tsx
// Already integrated in app/provider.tsx
<ClerkProvider>
  <UserSyncProvider>
    {children}
  </UserSyncProvider>
</ClerkProvider>
```

## 🌐 API Endpoints

### 1. GET /api/users/current
**Purpose:** Fetch current authenticated user's database information

**Authentication:** Required (Clerk session)

**Response:**
```json
{
  "id": 1,
  "clerkId": "user_abc123",
  "firstName": "John",
  "lastName": "Doe",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "user",
  "status": "active",
  "isPremium": false,
  "credits": 100,
  "creditsRemaining": 75,
  "isEmailVerified": true,
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

### 2. POST /api/users
**Purpose:** Create a new user manually

**Authentication:** Required (Clerk session)

**Request Body:**
```json
{
  "clerkId": "user_abc123",
  "firstName": "John",
  "lastName": "Doe",
  "name": "John Doe",
  "age": 30,
  "email": "john@example.com"
}
```

### 3. PUT /api/users
**Purpose:** Update existing user

**Request Body:**
```json
{
  "id": 1,
  "firstName": "Jane",
  "lastName": "Smith",
  "name": "Jane Smith",
  "age": 28,
  "email": "jane@example.com",
  "clerkId": "user_abc123"
}
```

### 4. DELETE /api/users?id=1
**Purpose:** Delete user by ID

## 🪝 React Hooks

### useCurrentUser Hook
Located: `hooks/useCurrentUser.ts`

**Purpose:** Fetch and manage current user's database information

**Usage:**
```tsx
import { useCurrentUser } from '@/hooks/useCurrentUser';

function MyComponent() {
  const { user, loading, error, refetch } = useCurrentUser();
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!user) return <div>Not signed in</div>;
  
  return (
    <div>
      <h1>Welcome {user.firstName}!</h1>
      <p>Credits: {user.creditsRemaining}/{user.credits}</p>
      <button onClick={refetch}>Refresh</button>
    </div>
  );
}
```

### useUserManagement Hook
Located: `hooks/useUserManagement.ts`

**Purpose:** Comprehensive hook combining current user data and user creation

**Usage:**
```tsx
import { useUserManagement } from '@/hooks/useUserManagement';

function AdminPanel() {
  const {
    currentUser,
    loading,
    error,
    refetchCurrentUser,
    createUser,
    creating,
    createError
  } = useUserManagement();
  
  const handleCreateUser = async () => {
    try {
      await createUser({
        clerkId: 'user_new123',
        firstName: 'New',
        lastName: 'User',
        name: 'New User',
        age: 25,
        email: 'new@example.com'
      });
      alert('User created!');
    } catch (error) {
      console.error('Failed to create user:', error);
    }
  };
  
  return (
    <div>
      {/* Current user display */}
      {currentUser && <div>Current: {currentUser.name}</div>}
      
      {/* User creation */}
      <button onClick={handleCreateUser} disabled={creating}>
        {creating ? 'Creating...' : 'Create User'}
      </button>
    </div>
  );
}
```

## 🎨 UI Components

### UserProfile Component
Located: `components/UserProfile.tsx`

**Purpose:** Display current user's database information with loading/error states

**Features:**
- ✅ Loading skeleton
- ✅ Error handling with retry
- ✅ Comprehensive user data display
- ✅ Manual refresh functionality
- ✅ Responsive design

### UserManagement Component
Located: `components/UserManagement.tsx`

**Purpose:** Complete user management interface

**Features:**
- ✅ Current user profile display
- ✅ User creation form
- ✅ Auto-fill with Clerk data
- ✅ Form validation
- ✅ Error handling
- ✅ Loading states
- ✅ Admin-style interface

**Usage:**
```tsx
import { UserManagement } from '@/components/UserManagement';

function AdminPage() {
  return (
    <div>
      <h1>User Management</h1>
      <UserManagement />
    </div>
  );
}
```

## 🔧 Provider Functions

### CreateNewUser Function
Located: `app/provider.tsx`

**Purpose:** Direct function for creating users (exported from provider)

**Usage:**
```tsx
import { CreateNewUser } from '@/app/provider';

const userData = {
  clerkId: 'user_abc123',
  firstName: 'John',
  lastName: 'Doe',
  name: 'John Doe',
  age: 30,
  email: 'john@example.com'
};

try {
  const result = await CreateNewUser(userData);
  console.log('User created:', result);
} catch (error) {
  console.error('Error:', error);
}
```

## 🚀 Getting Started

### 1. Basic Usage (Display Current User)
```tsx
import { useCurrentUser } from '@/hooks/useCurrentUser';

function ProfilePage() {
  const { user, loading, error } = useCurrentUser();
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div>
      <h1>{user?.firstName} {user?.lastName}</h1>
      <p>{user?.email}</p>
      <p>Credits: {user?.creditsRemaining}</p>
    </div>
  );
}
```

### 2. Advanced Usage (Full Management)
```tsx
import { UserManagement } from '@/components/UserManagement';

function AdminDashboard() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      <UserManagement />
    </div>
  );
}
```

### 3. Custom Implementation
```tsx
import { useUserManagement } from '@/hooks/useUserManagement';

function CustomUserInterface() {
  const { currentUser, createUser, loading } = useUserManagement();
  
  // Your custom implementation here
  return <div>Custom UI</div>;
}
```

## 🔐 Security Features

- ✅ **Clerk Authentication** - All endpoints require valid Clerk session
- ✅ **Server-side Validation** - Input validation on all API routes
- ✅ **Type Safety** - Full TypeScript support throughout
- ✅ **Error Handling** - Comprehensive error states and logging
- ✅ **Data Sanitization** - Proper data cleaning and validation

## 🔄 Data Flow

1. **User Signs In** → Clerk provides authentication
2. **UserSyncProvider** → Automatically syncs user to database
3. **useCurrentUser** → Fetches current user data from database
4. **UI Components** → Display user information
5. **Manual Creation** → Admin can create additional users
6. **Real-time Updates** → Refetch functionality for live data

## 📝 Best Practices

1. **Use hooks for data access** - Prefer `useCurrentUser` over direct API calls
2. **Handle loading states** - Always show loading indicators
3. **Implement error boundaries** - Graceful error handling
4. **Validate user input** - Client and server-side validation
5. **Cache user data** - Hooks provide automatic caching
6. **Use TypeScript** - Leverage type safety throughout

## 🛠️ Troubleshooting

### Common Issues

1. **User not found in database**
   - Check if UserSyncProvider is properly integrated
   - Verify Clerk webhook is configured
   - Manually trigger sync with refetch function

2. **Permission errors**
   - Ensure user is authenticated with Clerk
   - Check API route authentication

3. **Build errors**
   - Verify all imports are correct
   - Check TypeScript types match schema

### Debug Tools

- Use `npm run db:studio` to view database directly
- Check browser console for API errors
- Use `refetch()` function to manually sync data

## 🎯 Summary

This user management system provides:

✅ **Complete CRUD operations** for users  
✅ **Automatic synchronization** between Clerk and database  
✅ **Type-safe React hooks** for easy data access  
✅ **Ready-to-use UI components** with proper error handling  
✅ **Flexible architecture** supporting both automatic and manual user management  
✅ **Production-ready security** with Clerk authentication  

The system is designed to be both powerful for admin use cases and simple for basic user profile display. 