import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client.js";

const DEV_USER_ID = "00000000-0000-4000-8000-000000000001";
const DEV_USER_EMAIL = "dev@horace.local";
const AGENCY_NAMES = [
  "Acadomia Strasbourg",
  "Acadomia Mulhouse",
  "Acadomia Live",
  "Anacours",
  "CESU / Direct",
] as const;

const databaseUrl = process.env["DATABASE_URL"];

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to seed the database");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

async function main(): Promise<void> {
  await prisma.user.upsert({
    where: { id: DEV_USER_ID },
    update: {},
    create: {
      id: DEV_USER_ID,
      email: DEV_USER_EMAIL,
      displayName: "Local Development User",
      timeZone: "Europe/Paris",
      currency: "EUR",
    },
  });

  for (const name of AGENCY_NAMES) {
    await prisma.agency.upsert({
      where: {
        ownerId_name: {
          ownerId: DEV_USER_ID,
          name,
        },
      },
      update: {},
      create: {
        ownerId: DEV_USER_ID,
        name,
      },
    });
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
