import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";

import { env } from "../src/config/env.js";
import { PrismaClient } from "../src/generated/prisma/client.js";

const DEV_USER_EMAIL = "dev@horace.local";
const AGENCY_NAMES = [
  "Acadomia Strasbourg",
  "Acadomia Mulhouse",
  "Acadomia Live",
  "Anacours",
  "CESU / Direct",
] as const;

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: env.DATABASE_URL }),
});

async function main(): Promise<void> {
  await prisma.user.upsert({
    where: { id: env.DEV_USER_ID },
    update: {},
    create: {
      id: env.DEV_USER_ID,
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
          ownerId: env.DEV_USER_ID,
          name,
        },
      },
      update: {},
      create: {
        ownerId: env.DEV_USER_ID,
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
