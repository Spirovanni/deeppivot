# Deep Pivot Setup Guide

## Environment Variables Required

Create a `.env.local` file in your project root with the following variables:

### Clerk Authentication
```bash
# Get these from your Clerk Dashboard (https://dashboard.clerk.dev)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here
CLERK_SECRET_KEY=your_clerk_secret_key_here

# Clerk URLs (these are already configured in the app)
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/
```

### Hume AI Configuration
```bash
# Get these from your Hume AI Dashboard
HUME_API_KEY=your_hume_api_key_here
HUME_SECRET_KEY=your_hume_secret_key_here
NEXT_PUBLIC_HUME_CONFIG_ID=your_hume_config_id_here
```

### Database
```bash
# Your PostgreSQL database connection string
DATABASE_URL=your_database_url_here
```

## Setup Steps

1. **Clone the repository**
2. **Install dependencies**: `pnpm install`
3. **Set up Clerk**:
   - Create an account at [Clerk](https://clerk.dev)
   - Create a new application
   - Copy your publishable key and secret key to your `.env.local` file
4. **Set up Hume AI**:
   - Create an account at [Hume AI](https://hume.ai)
   - Get your API credentials
   - Add them to your `.env.local` file
5. **Set up Database**:
   - Set up a PostgreSQL database
   - Add the connection string to your `.env.local` file
   - Run `pnpm db:push` to set up the database schema
6. **Run the development server**: `pnpm dev`

## Authentication Features

The app now includes:
- Custom sign-in page at `/sign-in`
- Custom sign-up page at `/sign-up`
- Authentication state management in the navbar
- Protected routes (configured in `middleware.ts`)
- User profile management with Clerk's UserButton component

## Usage

- **For new users**: Click "Get Started" in the navbar or hero section to sign up
- **For existing users**: Click "Sign In" in the navbar
- **After signing in**: The interface will show your name and provide access to user settings
- **Signed-in users**: Can access the full coaching experience 