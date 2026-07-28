import { prisma } from "../../src/infrastructure/database/prisma.js";
import { TEST_OWNER_ID } from "./database.js";

let fixtureSequence = 0;

const nextFixtureName = (prefix: string): string => {
  fixtureSequence += 1;
  return `${prefix} ${fixtureSequence}`;
};

export const createAgencyFixture = (
  ownerId = TEST_OWNER_ID,
  isActive = true,
) =>
  prisma.agency.create({
    data: {
      ownerId,
      name: nextFixtureName("Agency"),
      isActive,
    },
  });

export const createRepresentativeFixture = (ownerId = TEST_OWNER_ID) =>
  prisma.representative.create({
    data: {
      ownerId,
      firstName: "Representative",
      lastName: nextFixtureName("Fixture"),
    },
  });

export const createStudentFixture = async ({
  ownerId = TEST_OWNER_ID,
  agencyId,
  defaultHourlyRateCents = 2_700,
  isActive = true,
}: {
  ownerId?: string;
  agencyId?: string;
  defaultHourlyRateCents?: number | null;
  isActive?: boolean;
} = {}) => {
  const agency =
    agencyId === undefined ? await createAgencyFixture(ownerId) : undefined;

  return prisma.student.create({
    data: {
      ownerId,
      agencyId: agencyId ?? agency?.id ?? "",
      firstName: "Student",
      lastName: nextFixtureName("Fixture"),
      defaultHourlyRateCents,
      isActive,
    },
  });
};

export const createLessonFixture = async ({
  ownerId = TEST_OWNER_ID,
  studentId,
  agencyId,
  status = "PLANNED",
  startsAt = new Date("2026-09-01T10:00:00.000Z"),
  endsAt = new Date("2026-09-01T11:00:00.000Z"),
  hourlyRateCents = 2_700,
}: {
  ownerId?: string;
  studentId: string;
  agencyId: string;
  status?: "PLANNED" | "COMPLETED" | "CANCELLED";
  startsAt?: Date;
  endsAt?: Date;
  hourlyRateCents?: number;
}) =>
  prisma.lesson.create({
    data: {
      ownerId,
      studentId,
      agencyId,
      status,
      startsAt,
      endsAt,
      hourlyRateCents,
      amountCents:
        status === "CANCELLED"
          ? 0
          : Math.round(
              ((endsAt.getTime() - startsAt.getTime()) * hourlyRateCents) /
                3_600_000,
            ),
    },
  });
