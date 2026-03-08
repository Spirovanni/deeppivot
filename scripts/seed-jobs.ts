import "dotenv/config";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../src/db/schema";
import { eq } from "drizzle-orm";

const db = drizzle(process.env.DATABASE_URL!, { schema });

const COMPANIES = [
    { name: "Google", website: "https://about.google", size: "500+", industry: "Technology", location: "Mountain View, CA", description: "Google's mission is to organize the world's information and make it universally accessible and useful." },
    { name: "Meta", website: "https://about.meta.com", size: "500+", industry: "Social Media", location: "Menlo Park, CA", description: "Meta builds technologies that help people connect, find communities, and grow businesses." },
    { name: "Amazon", website: "https://aboutamazon.com", size: "500+", industry: "E-commerce & Cloud", location: "Seattle, WA", description: "Amazon is guided by four principles: customer obsession rather than competitor focus, passion for invention, commitment to operational excellence, and long-term thinking." },
    { name: "Microsoft", website: "https://microsoft.com", size: "500+", industry: "Technology", location: "Redmond, WA", description: "Our mission is to empower every person and every organization on the planet to achieve more." },
    { name: "OpenAI", website: "https://openai.com", size: "201-500", industry: "Artificial Intelligence", location: "San Francisco, CA", description: "OpenAI is an AI research and deployment company. Our mission is to ensure that artificial general intelligence benefits all of humanity." },
    { name: "Stripe", website: "https://stripe.com", size: "500+", industry: "Fintech", location: "San Francisco, CA", description: "Stripe is a financial infrastructure platform for businesses. Millions of companies—from the world’s largest enterprises to the most ambitious startups—use Stripe to accept payments, grow their revenue, and accelerate new business opportunities." },
    { name: "Airbnb", website: "https://airbnb.com", size: "500+", industry: "Hospitality", location: "San Francisco, CA", description: "Airbnb was born in 2007 when two hosts welcomed three guests to their San Francisco home, and has since grown to over 4 million hosts who have welcomed more than 1 billion guest arrivals in almost every country across the globe." },
    { name: "Netflix", website: "https://netflix.com", size: "500+", industry: "Entertainment", location: "Los Gatos, CA", description: "Netflix is the world's leading streaming entertainment service with over 200 million paid memberships in over 190 countries." },
    { name: "Uber", website: "https://uber.com", size: "500+", industry: "Transportation", location: "San Francisco, CA", description: "Uber is a technology platform that connects the physical and digital worlds to make movement happen at the tap of a button." },
    { name: "Anthropic", website: "https://anthropic.com", size: "51-200", industry: "Artificial Intelligence", location: "San Francisco, CA", description: "Anthropic is an AI safety and research company that’s working to build reliable, interpretable, and steerable AI systems." }
];

const JOB_TITLES = [
    "Senior Software Engineer",
    "Product Manager",
    "Product Designer",
    "Machine Learning Engineer",
    "Frontend Engineer",
    "Backend Engineer",
    "Full Stack Developer",
    "DevOps Engineer",
    "Data Scientist",
    "Engineering Manager"
];

const LOCATIONS = [
    "San Francisco, CA",
    "New York, NY",
    "Remote",
    "Seattle, WA",
    "London, UK",
    "Austin, TX",
    "Palo Alto, CA"
];

function getRandomItem<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
    console.log("🌱 Starting job seeding...");

    // Find an admin user to own the companies
    const [adminUser] = await db
        .select({ id: schema.usersTable.id })
        .from(schema.usersTable)
        .where(eq(schema.usersTable.role, "admin"))
        .limit(1);

    if (!adminUser) {
        console.error("❌ No admin user found. Please create one first.");
        process.exit(1);
    }

    console.log(`👤 Using admin user ID: ${adminUser.id}`);

    let companyCount = 0;
    let jobCount = 0;

    for (const companyData of COMPANIES) {
        // 1. Insert Company
        const [insertedCompany] = await db.insert(schema.companiesTable).values({
            ownerUserId: adminUser.id,
            name: companyData.name,
            website: companyData.website,
            size: companyData.size,
            industry: companyData.industry,
            location: companyData.location,
            description: companyData.description,
        }).returning({ id: schema.companiesTable.id });

        companyCount++;
        console.log(`🏢 Created company: ${companyData.name}`);

        // 2. Insert 6 jobs per company
        for (let i = 1; i <= 6; i++) {
            const title = getRandomItem(JOB_TITLES);
            const location = getRandomItem(LOCATIONS);
            const isRemote = location === "Remote";
            const type = getRandomItem(["full_time", "contract", "full_time", "full_time"]);
            const level = getRandomItem(["entry", "mid", "senior", "senior", "executive"]);

            const salaryMin = getRandomInt(100000, 150000) * 100; // in cents
            const salaryMax = salaryMin + getRandomInt(20000, 80000) * 100;

            await db.insert(schema.jobsTable).values({
                companyId: insertedCompany.id,
                title: `${title} - ${companyData.name} Team ${i}`,
                description: `Join the ${companyData.name} team as a ${title}. We are looking for talented individuals to help us build the next generation of ${companyData.industry} solutions. Responsibilities include working on complex systems, collaborating with cross-functional teams, and driving innovation. Requirements: Experience in relevant technologies, strong problem-solving skills, and a passion for excellence.`,
                location: location,
                jobType: type as any,
                experienceLevel: level as any,
                salaryMin: salaryMin,
                salaryMax: salaryMax,
                remoteFlag: isRemote,
                status: "published",
            });

            jobCount++;
        }
    }

    console.log(`\n✅ Seeding complete!`);
    console.log(`🏢 Companies created: ${companyCount}`);
    console.log(`💼 Jobs created: ${jobCount}`);
    process.exit(0);
}

main().catch((err) => {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
});
