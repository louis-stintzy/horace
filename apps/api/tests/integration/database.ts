import { assertSafeTestDatabase } from "./test-environment.js";
import { prisma } from "../../src/infrastructure/database/prisma.js";

export const TEST_OWNER_ID = "00000000-0000-4000-8000-000000000101";
export const OTHER_OWNER_ID = "00000000-0000-4000-8000-000000000102";

export const cleanTestDatabase = async (): Promise<void> => {
  assertSafeTestDatabase();

  await prisma.$transaction([
    prisma.lesson.deleteMany(),
    prisma.studentRepresentative.deleteMany(),
    prisma.student.deleteMany(),
    prisma.representative.deleteMany(),
    prisma.agency.deleteMany(),
    prisma.user.deleteMany(),
  ]);
};

export const resetTestDatabase = async (): Promise<void> => {
  await cleanTestDatabase();
  await prisma.user.createMany({
    data: [
      {
        id: TEST_OWNER_ID,
        email: "owner@test.horace.local",
        displayName: "Test Owner",
      },
      {
        id: OTHER_OWNER_ID,
        email: "other@test.horace.local",
        displayName: "Other Owner",
      },
    ],
  });
};

export const disconnectTestDatabase = async (): Promise<void> => {
  await prisma.$disconnect();
};
