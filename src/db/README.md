# Database Setup with Drizzle + Supabase

This directory contains the database configuration and schema files for the Drizzle-Supabase integration.

## File Structure

```
src/db/
├── schema.ts    # Database schema definitions
├── index.ts     # Database connection utility
└── README.md    # This file
```

## Setup Instructions

1. **Environment Variables**: Make sure your `.env` file contains:
   ```
   DATABASE_URL=your_supabase_database_url_here
   ```

2. **Generate Migration**: Create migration files from your schema
   ```bash
   npm run db:generate
   ```

3. **Apply Migration**: Apply migrations to your database
   ```bash
   npm run db:migrate
   ```

4. **Push Changes**: Alternatively, push schema changes directly (for development)
   ```bash
   npm run db:push
   ```

5. **Run Seed Script**: Test your database connection and seed data
   ```bash
   npm run db:seed
   ```

6. **Open Drizzle Studio**: View and manage your database
   ```bash
   npm run db:studio
   ```

## Usage in Next.js

Import the database connection in your API routes or server components:

```typescript
import { db } from '@/src/db';
import { usersTable } from '@/src/db/schema';

// Example usage
const users = await db.select().from(usersTable);
```

## Important Notes

- The connection is configured with `prepare: false` to support Supabase's Transaction pool mode
- All database operations should be performed server-side (API routes or server components)
- Never expose database credentials in client-side code 