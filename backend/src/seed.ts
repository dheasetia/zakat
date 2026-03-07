import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db } from "./db";
import { users } from "./db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

async function runSeed() {
    try {
        console.log("Checking if admin user exists...");
        const existingAdmin = await db.select().from(users).where(eq(users.email, 'admin@zakat.com'));

        if (existingAdmin.length === 0) {
            console.log("Admin user not found. Seeding default admin...");
            const saltRounds = 10;
            const passwordHash = await bcrypt.hash('password123', saltRounds);

            await db.insert(users).values({
                name: 'Admin Utama',
                email: 'admin@zakat.com',
                passwordHash: passwordHash,
                role: 'ADMIN'
            });
            console.log("Default admin seeded successfully! (admin@zakat.com / password123)");
        } else {
            console.log("Admin user already exists. Skipping seed.");
        }
    } catch (error) {
        console.error("Error during seeding:", error);
    }
}

runSeed().then(() => {
    console.log("Seed script completed.");
    process.exit(0);
});
