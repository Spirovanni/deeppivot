/**
 * One-time script to promote a user to admin by email.
 *
 * Usage:
 *   npx tsx scripts/set-admin.ts
 */
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { usersTable } from '../src/db/schema';
import { eq } from 'drizzle-orm';

const TARGET_EMAIL = 'blackshieldsx@gmail.com';

async function main() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const db = drizzle(pool);

    const [user] = await db
        .select({ id: usersTable.id, email: usersTable.email, role: usersTable.role })
        .from(usersTable)
        .where(eq(usersTable.email, TARGET_EMAIL))
        .limit(1);

    if (!user) {
        console.error(`❌  No user found with email: ${TARGET_EMAIL}`);
        console.error('   Make sure the user has signed up and been synced to the DB first.');
        process.exit(1);
    }

    if (user.role === 'admin') {
        console.log(`ℹ️  ${TARGET_EMAIL} is already an admin (id=${user.id}). Nothing to do.`);
        await pool.end();
        return;
    }

    await db
        .update(usersTable)
        .set({ role: 'admin', updatedAt: new Date() })
        .where(eq(usersTable.id, user.id));

    console.log(`✅  ${TARGET_EMAIL} (id=${user.id}) promoted to admin!`);
    await pool.end();
}

main().catch((err) => {
    console.error('Script failed:', err);
    process.exit(1);
});
