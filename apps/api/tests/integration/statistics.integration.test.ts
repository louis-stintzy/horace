import request from "supertest";
import { describe, expect, it } from "vitest";

import { app } from "../../src/app.js";
import { prisma } from "../../src/infrastructure/database/prisma.js";
import { OTHER_OWNER_ID } from "./database.js";
import {
  createAgencyFixture,
  createLessonFixture,
  createStudentFixture,
} from "./fixtures.js";
import { bodyAs, type DataBody, type ErrorBody } from "./test-types.js";

interface StatisticsAggregate {
  lessonCount: number;
  durationMinutes: number;
  amountCents: number;
}

interface StatisticsPeriod {
  from: string;
  to: string;
  timeZone: string;
  currency?: string;
}

interface StatisticsSummary {
  period: StatisticsPeriod;
  byStatus: Record<"PLANNED" | "COMPLETED" | "CANCELLED", StatisticsAggregate>;
}

interface StatisticsTimeline {
  period: StatisticsPeriod;
  groupBy: "day" | "week" | "month";
  status: "PLANNED" | "COMPLETED" | "CANCELLED";
  items: Array<
    StatisticsAggregate & {
      periodStart: string;
    }
  >;
}

interface StatisticsByStudent {
  period: StatisticsPeriod;
  status: "PLANNED" | "COMPLETED" | "CANCELLED";
  items: Array<
    StatisticsAggregate & {
      student: {
        id: string;
        firstName: string;
        lastName: string;
      };
    }
  >;
}

interface StatisticsByAgency {
  period: StatisticsPeriod;
  status: "PLANNED" | "COMPLETED" | "CANCELLED";
  items: Array<
    StatisticsAggregate & {
      agency: {
        id: string;
        name: string;
      };
    }
  >;
}

const FULL_PERIOD = {
  from: "2026-01-01T00:00:00Z",
  to: "2027-01-01T00:00:00Z",
};

describe("statistics", () => {
  it("summarizes all statuses with inclusive and exclusive period bounds", async () => {
    const agency = await createAgencyFixture();
    const student = await createStudentFixture({ agencyId: agency.id });
    const otherAgency = await createAgencyFixture(OTHER_OWNER_ID);
    const otherStudent = await createStudentFixture({
      ownerId: OTHER_OWNER_ID,
      agencyId: otherAgency.id,
    });

    await createLessonFixture({
      studentId: student.id,
      agencyId: agency.id,
      status: "PLANNED",
      startsAt: new Date("2026-07-01T00:00:00Z"),
      endsAt: new Date("2026-07-01T01:00:00Z"),
    });
    await createLessonFixture({
      studentId: student.id,
      agencyId: agency.id,
      status: "COMPLETED",
      startsAt: new Date("2026-07-02T10:00:00Z"),
      endsAt: new Date("2026-07-02T11:30:00Z"),
    });
    await createLessonFixture({
      studentId: student.id,
      agencyId: agency.id,
      status: "CANCELLED",
      startsAt: new Date("2026-07-03T10:00:00Z"),
      endsAt: new Date("2026-07-03T10:30:00Z"),
    });
    await createLessonFixture({
      studentId: student.id,
      agencyId: agency.id,
      status: "COMPLETED",
      startsAt: new Date("2026-08-01T00:00:00Z"),
      endsAt: new Date("2026-08-01T01:00:00Z"),
    });
    await createLessonFixture({
      ownerId: OTHER_OWNER_ID,
      studentId: otherStudent.id,
      agencyId: otherAgency.id,
      status: "COMPLETED",
      startsAt: new Date("2026-07-02T10:00:00Z"),
      endsAt: new Date("2026-07-02T11:00:00Z"),
    });

    const response = await request(app)
      .get("/api/v1/statistics/summary")
      .query({
        from: "2026-07-01T00:00:00Z",
        to: "2026-08-01T00:00:00Z",
      })
      .expect(200);
    const statistics = bodyAs<DataBody<StatisticsSummary>>(response).data;

    expect(statistics.period).toEqual({
      from: "2026-07-01T00:00:00.000Z",
      to: "2026-08-01T00:00:00.000Z",
      timeZone: "Europe/Paris",
      currency: "EUR",
    });
    expect(statistics.byStatus).toEqual({
      PLANNED: {
        lessonCount: 1,
        durationMinutes: 60,
        amountCents: 2_700,
      },
      COMPLETED: {
        lessonCount: 1,
        durationMinutes: 90,
        amountCents: 4_050,
      },
      CANCELLED: {
        lessonCount: 1,
        durationMinutes: 30,
        amountCents: 0,
      },
    });
  });

  it("rounds the aggregated duration to the nearest minute", async () => {
    const agency = await createAgencyFixture();
    const student = await createStudentFixture({ agencyId: agency.id });

    for (const startsAt of [
      new Date("2026-07-05T10:00:00.000Z"),
      new Date("2026-07-05T11:00:00.000Z"),
    ]) {
      await createLessonFixture({
        studentId: student.id,
        agencyId: agency.id,
        status: "COMPLETED",
        startsAt,
        endsAt: new Date(startsAt.getTime() + 30_400),
      });
    }

    const response = await request(app)
      .get("/api/v1/statistics/summary")
      .query(FULL_PERIOD)
      .expect(200);

    expect(
      bodyAs<DataBody<StatisticsSummary>>(response).data.byStatus.COMPLETED
        .durationMinutes,
    ).toBe(1);
  });

  it("validates periods, groupings and statuses", async () => {
    await request(app)
      .get("/api/v1/statistics/summary")
      .query({
        from: "2026-07-02T00:00:00Z",
        to: "2026-07-01T00:00:00Z",
      })
      .expect(400);
    await request(app)
      .get("/api/v1/statistics/timeline")
      .query({ ...FULL_PERIOD, groupBy: "year" })
      .expect(400);
    await request(app)
      .get("/api/v1/statistics/by-student")
      .query({ ...FULL_PERIOD, status: "UNKNOWN" })
      .expect(400);
  });

  it("rejects student and agency filters owned by another user", async () => {
    const agency = await createAgencyFixture(OTHER_OWNER_ID);
    const student = await createStudentFixture({
      ownerId: OTHER_OWNER_ID,
      agencyId: agency.id,
    });

    const studentResponse = await request(app)
      .get("/api/v1/statistics/summary")
      .query({ ...FULL_PERIOD, studentId: student.id })
      .expect(404);
    expect(bodyAs<ErrorBody>(studentResponse).error.code).toBe("STUDENT_NOT_FOUND");

    const agencyResponse = await request(app)
      .get("/api/v1/statistics/summary")
      .query({ ...FULL_PERIOD, agencyId: agency.id })
      .expect(404);
    expect(bodyAs<ErrorBody>(agencyResponse).error.code).toBe("AGENCY_NOT_FOUND");
  });

  it("groups timelines by Paris day, ISO week and month with a completed default", async () => {
    const agency = await createAgencyFixture();
    const student = await createStudentFixture({ agencyId: agency.id });
    await createLessonFixture({
      studentId: student.id,
      agencyId: agency.id,
      status: "COMPLETED",
      startsAt: new Date("2026-07-31T22:30:00Z"),
      endsAt: new Date("2026-07-31T23:30:00Z"),
    });

    for (const { groupBy, periodStart } of [
      { groupBy: "day", periodStart: "2026-08-01" },
      { groupBy: "week", periodStart: "2026-07-27" },
      { groupBy: "month", periodStart: "2026-08-01" },
    ]) {
      const response = await request(app)
        .get("/api/v1/statistics/timeline")
        .query({ ...FULL_PERIOD, groupBy })
        .expect(200);
      const statistics = bodyAs<DataBody<StatisticsTimeline>>(response).data;

      expect(statistics.status).toBe("COMPLETED");
      expect(statistics.items).toEqual([
        {
          periodStart,
          lessonCount: 1,
          durationMinutes: 60,
          amountCents: 2_700,
        },
      ]);
    }
  });

  it("aggregates and orders completed lessons by student", async () => {
    const agency = await createAgencyFixture();
    const firstStudent = await createStudentFixture({ agencyId: agency.id });
    const secondStudent = await createStudentFixture({
      agencyId: agency.id,
      defaultHourlyRateCents: 5_000,
    });

    await createLessonFixture({
      studentId: firstStudent.id,
      agencyId: agency.id,
      status: "COMPLETED",
    });
    await createLessonFixture({
      studentId: firstStudent.id,
      agencyId: agency.id,
      status: "COMPLETED",
      startsAt: new Date("2026-09-02T10:00:00Z"),
      endsAt: new Date("2026-09-02T10:30:00Z"),
    });
    await createLessonFixture({
      studentId: secondStudent.id,
      agencyId: agency.id,
      status: "COMPLETED",
      hourlyRateCents: 5_000,
    });
    await prisma.student.updateMany({
      where: { id: { in: [firstStudent.id, secondStudent.id] } },
      data: { isActive: false },
    });

    const response = await request(app)
      .get("/api/v1/statistics/by-student")
      .query(FULL_PERIOD)
      .expect(200);
    const statistics = bodyAs<DataBody<StatisticsByStudent>>(response).data;

    expect(statistics.status).toBe("COMPLETED");
    expect(statistics.items.map(({ student, ...aggregate }) => ({
      studentId: student.id,
      ...aggregate,
    }))).toEqual([
      {
        studentId: secondStudent.id,
        lessonCount: 1,
        durationMinutes: 60,
        amountCents: 5_000,
      },
      {
        studentId: firstStudent.id,
        lessonCount: 2,
        durationMinutes: 90,
        amountCents: 4_050,
      },
    ]);
  });

  it("uses lesson agency and amount snapshots for historical inactive resources", async () => {
    const historicalAgency = await createAgencyFixture();
    const currentAgency = await createAgencyFixture();
    const student = await createStudentFixture({
      agencyId: historicalAgency.id,
      defaultHourlyRateCents: 2_700,
    });
    await createLessonFixture({
      studentId: student.id,
      agencyId: historicalAgency.id,
      status: "COMPLETED",
      hourlyRateCents: 2_700,
    });
    await prisma.student.update({
      where: { id: student.id },
      data: {
        agencyId: currentAgency.id,
        defaultHourlyRateCents: 9_999,
        isActive: false,
      },
    });
    await prisma.agency.update({
      where: { id: historicalAgency.id },
      data: { isActive: false },
    });

    const agencyResponse = await request(app)
      .get("/api/v1/statistics/by-agency")
      .query(FULL_PERIOD)
      .expect(200);
    const agencyStatistics =
      bodyAs<DataBody<StatisticsByAgency>>(agencyResponse).data;

    expect(agencyStatistics.status).toBe("COMPLETED");
    expect(agencyStatistics.items).toEqual([
      {
        agency: {
          id: historicalAgency.id,
          name: historicalAgency.name,
        },
        lessonCount: 1,
        durationMinutes: 60,
        amountCents: 2_700,
      },
    ]);

    await request(app)
      .get("/api/v1/statistics/summary")
      .query({
        ...FULL_PERIOD,
        studentId: student.id,
        agencyId: historicalAgency.id,
      })
      .expect(200);
  });
});
