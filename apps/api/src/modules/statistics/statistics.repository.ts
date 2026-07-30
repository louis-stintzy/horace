import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../infrastructure/database/prisma.js";
import type { StatisticsStatus } from "./statistics.schemas.js";

export interface StatisticsOwnerContext {
  timeZone: string;
  currency: string;
}

export interface StatisticsAggregate {
  lessonCount: number;
  durationMinutes: number;
  amountCents: number;
}

export interface StatisticsSummaryRow extends StatisticsAggregate {
  status: StatisticsStatus;
}

export interface StatisticsTimelineRow extends StatisticsAggregate {
  periodStart: string;
}

export interface StatisticsByStudentRow extends StatisticsAggregate {
  student: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface StatisticsByAgencyRow extends StatisticsAggregate {
  agency: {
    id: string;
    name: string;
  };
}

export interface StatisticsPeriodFilters {
  from: Date;
  to: Date;
  studentId?: string | undefined;
  agencyId?: string | undefined;
}

export class StatisticsOwnerNotFoundRepositoryError extends Error {}
export class StatisticsStudentNotFoundRepositoryError extends Error {}
export class StatisticsAgencyNotFoundRepositoryError extends Error {}

interface RawAggregate {
  lessonCount: bigint;
  durationMinutes: bigint;
  amountCents: bigint;
}

interface RawSummaryRow extends RawAggregate {
  status: StatisticsStatus;
}

interface RawTimelineRow extends RawAggregate {
  periodStart: string;
}

interface RawByStudentRow extends RawAggregate {
  studentId: string;
  firstName: string;
  lastName: string;
}

interface RawByAgencyRow extends RawAggregate {
  agencyId: string;
  agencyName: string;
}

const GROUP_BY_SQL = {
  day: Prisma.sql`'day'`,
  week: Prisma.sql`'week'`,
  month: Prisma.sql`'month'`,
} as const;

const toSafeInteger = (value: bigint, field: string): number => {
  const converted = Number(value);

  if (!Number.isSafeInteger(converted)) {
    throw new Error(`Statistics ${field} exceeds the safe integer range`);
  }

  return converted;
};

const mapAggregate = (row: RawAggregate): StatisticsAggregate => ({
  lessonCount: toSafeInteger(row.lessonCount, "lessonCount"),
  durationMinutes: toSafeInteger(row.durationMinutes, "durationMinutes"),
  amountCents: toSafeInteger(row.amountCents, "amountCents"),
});

const lessonFiltersSql = (
  ownerId: string,
  filters: StatisticsPeriodFilters,
): Prisma.Sql => Prisma.sql`
  l."ownerId" = ${ownerId}::uuid
  AND l."startsAt" >= ${filters.from}
  AND l."startsAt" < ${filters.to}
  ${
    filters.studentId === undefined
      ? Prisma.empty
      : Prisma.sql`AND l."studentId" = ${filters.studentId}::uuid`
  }
  ${
    filters.agencyId === undefined
      ? Prisma.empty
      : Prisma.sql`AND l."agencyId" = ${filters.agencyId}::uuid`
  }
`;

export class StatisticsRepository {
  async getOwnerContext(
    ownerId: string,
    filters: {
      studentId?: string | undefined;
      agencyId?: string | undefined;
    },
  ): Promise<StatisticsOwnerContext> {
    const owner = await prisma.user.findUnique({
      where: { id: ownerId },
      select: {
        timeZone: true,
        currency: true,
      },
    });

    if (!owner) {
      throw new StatisticsOwnerNotFoundRepositoryError();
    }

    if (filters.studentId !== undefined) {
      const student = await prisma.student.findUnique({
        where: {
          id_ownerId: {
            id: filters.studentId,
            ownerId,
          },
        },
        select: { id: true },
      });

      if (!student) {
        throw new StatisticsStudentNotFoundRepositoryError();
      }
    }

    if (filters.agencyId !== undefined) {
      const agency = await prisma.agency.findUnique({
        where: {
          id_ownerId: {
            id: filters.agencyId,
            ownerId,
          },
        },
        select: { id: true },
      });

      if (!agency) {
        throw new StatisticsAgencyNotFoundRepositoryError();
      }
    }

    return owner;
  }

  async summarize(
    ownerId: string,
    filters: StatisticsPeriodFilters,
  ): Promise<StatisticsSummaryRow[]> {
    const rows = await prisma.$queryRaw<RawSummaryRow[]>`
      SELECT
        l.status,
        COUNT(*)::bigint AS "lessonCount",
        ROUND(SUM(EXTRACT(EPOCH FROM (l."endsAt" - l."startsAt"))) / 60)::bigint
          AS "durationMinutes",
        SUM(l."amountCents")::bigint AS "amountCents"
      FROM "Lesson" l
      WHERE ${lessonFiltersSql(ownerId, filters)}
      GROUP BY l.status
    `;

    return rows.map((row) => ({
      status: row.status,
      ...mapAggregate(row),
    }));
  }

  async timeline(
    ownerId: string,
    filters: StatisticsPeriodFilters,
    groupBy: keyof typeof GROUP_BY_SQL,
    status: StatisticsStatus,
    timeZone: string,
  ): Promise<StatisticsTimelineRow[]> {
    const groupBySql = GROUP_BY_SQL[groupBy];
    const rows = await prisma.$queryRaw<RawTimelineRow[]>`
      SELECT
        DATE_TRUNC(${groupBySql}, l."startsAt" AT TIME ZONE ${timeZone})::date::text
          AS "periodStart",
        COUNT(*)::bigint AS "lessonCount",
        ROUND(SUM(EXTRACT(EPOCH FROM (l."endsAt" - l."startsAt"))) / 60)::bigint
          AS "durationMinutes",
        SUM(l."amountCents")::bigint AS "amountCents"
      FROM "Lesson" l
      WHERE ${lessonFiltersSql(ownerId, filters)}
        AND l.status = ${status}::"LessonStatus"
      GROUP BY 1
      ORDER BY 1 ASC
    `;

    return rows.map((row) => ({
      periodStart: row.periodStart,
      ...mapAggregate(row),
    }));
  }

  async byStudent(
    ownerId: string,
    filters: StatisticsPeriodFilters,
    status: StatisticsStatus,
  ): Promise<StatisticsByStudentRow[]> {
    const rows = await prisma.$queryRaw<RawByStudentRow[]>`
      SELECT
        s.id AS "studentId",
        s."firstName",
        s."lastName",
        COUNT(*)::bigint AS "lessonCount",
        ROUND(SUM(EXTRACT(EPOCH FROM (l."endsAt" - l."startsAt"))) / 60)::bigint
          AS "durationMinutes",
        SUM(l."amountCents")::bigint AS "amountCents"
      FROM "Lesson" l
      INNER JOIN "Student" s
        ON s.id = l."studentId" AND s."ownerId" = l."ownerId"
      WHERE ${lessonFiltersSql(ownerId, filters)}
        AND l.status = ${status}::"LessonStatus"
      GROUP BY s.id, s."firstName", s."lastName"
      ORDER BY "amountCents" DESC, "durationMinutes" DESC,
        s."lastName" ASC, s."firstName" ASC, s.id ASC
    `;

    return rows.map((row) => ({
      student: {
        id: row.studentId,
        firstName: row.firstName,
        lastName: row.lastName,
      },
      ...mapAggregate(row),
    }));
  }

  async byAgency(
    ownerId: string,
    filters: StatisticsPeriodFilters,
    status: StatisticsStatus,
  ): Promise<StatisticsByAgencyRow[]> {
    const rows = await prisma.$queryRaw<RawByAgencyRow[]>`
      SELECT
        a.id AS "agencyId",
        a.name AS "agencyName",
        COUNT(*)::bigint AS "lessonCount",
        ROUND(SUM(EXTRACT(EPOCH FROM (l."endsAt" - l."startsAt"))) / 60)::bigint
          AS "durationMinutes",
        SUM(l."amountCents")::bigint AS "amountCents"
      FROM "Lesson" l
      INNER JOIN "Agency" a
        ON a.id = l."agencyId" AND a."ownerId" = l."ownerId"
      WHERE ${lessonFiltersSql(ownerId, filters)}
        AND l.status = ${status}::"LessonStatus"
      GROUP BY a.id, a.name
      ORDER BY "amountCents" DESC, "durationMinutes" DESC, a.name ASC, a.id ASC
    `;

    return rows.map((row) => ({
      agency: {
        id: row.agencyId,
        name: row.agencyName,
      },
      ...mapAggregate(row),
    }));
  }
}
