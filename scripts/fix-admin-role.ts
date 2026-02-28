import { db } from "../src/db";
import { usersTable } from "../src/db/schema";
import { eq } from "drizzle-orm";

async function run() {
    const email = "blackshieldsx@gmail.com";
    console.log(`Setting ${email} to admin temporarily...`);

    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
    if (!user) {
        console.error(`User with email ${email} not found.`);
        process.exit(1);
    }

    await db.update(usersTable).set({ role: "admin" }).where(eq(usersTable.id, user.id));

    console.log(`Successfully set ${email} to admin.`);
    process.exit(0);
}

run().catch((error) => {
    console.error("Error upgrading user:", error);
    process.exit(1);
});
