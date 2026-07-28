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
import {
  bodyAs,
  type DataBody,
  type ErrorBody,
  type LessonResource,
} from "./test-types.js";

describe("lessons", () => {
  it("copies snapshots, calculates 4,050 cents and preserves existing history", async () => {
    const agency = await createAgencyFixture();
    const newAgency = await createAgencyFixture();
    const student = await createStudentFixture({
      agencyId: agency.id,
      defaultHourlyRateCents: 2_700,
    });

    const created = await request(app)
      .post("/api/v1/lessons")
      .send({
        studentId: student.id,
        startsAt: "2026-08-03T14:00:00+02:00",
        endsAt: "2026-08-03T15:30:00+02:00",
      })
      .expect(201);
    const lesson = bodyAs<DataBody<LessonResource>>(created).data;
    expect(lesson).toEqual(
      expect.objectContaining({
        agencyId: agency.id,
        hourlyRateCents: 2_700,
        amountCents: 4_050,
      }),
    );

    await request(app)
      .patch(`/api/v1/students/${student.id}`)
      .send({ agencyId: newAgency.id, defaultHourlyRateCents: 3_500 })
      .expect(200);

    const unchanged = await request(app)
      .get(`/api/v1/lessons/${lesson.id}`)
      .expect(200);
    expect(bodyAs<DataBody<LessonResource>>(unchanged).data).toEqual(
      expect.objectContaining({
        agencyId: agency.id,
        hourlyRateCents: 2_700,
        amountCents: 4_050,
      }),
    );
  });

  it("sets cancelled amounts to zero and recalculates when planned again", async () => {
    const student = await createStudentFixture();
    const created = await request(app)
      .post("/api/v1/lessons")
      .send({
        studentId: student.id,
        startsAt: "2026-08-04T10:00:00Z",
        endsAt: "2026-08-04T11:00:00Z",
      })
      .expect(201);
    const lesson = bodyAs<DataBody<LessonResource>>(created).data;

    const cancelled = await request(app)
      .patch(`/api/v1/lessons/${lesson.id}`)
      .send({ status: "CANCELLED" })
      .expect(200);
    expect(bodyAs<DataBody<LessonResource>>(cancelled).data.amountCents).toBe(0);

    const planned = await request(app)
      .patch(`/api/v1/lessons/${lesson.id}`)
      .send({ status: "PLANNED" })
      .expect(200);
    expect(bodyAs<DataBody<LessonResource>>(planned).data.amountCents).toBe(2_700);
  });

  it("rejects invalid periods and local date-times", async () => {
    const student = await createStudentFixture();

    await request(app)
      .post("/api/v1/lessons")
      .send({
        studentId: student.id,
        startsAt: "2026-08-04T11:00:00Z",
        endsAt: "2026-08-04T10:00:00Z",
      })
      .expect(400);

    await request(app)
      .post("/api/v1/lessons")
      .send({
        studentId: student.id,
        startsAt: "2026-08-04T10:00:00",
        endsAt: "2026-08-04T11:00:00",
      })
      .expect(400);
  });

  it("enforces active resources only for a final planned status", async () => {
    const inactiveAgency = await createAgencyFixture(undefined, false);
    const activeAgency = await createAgencyFixture();
    const inactiveStudent = await createStudentFixture({
      agencyId: activeAgency.id,
      isActive: false,
    });
    const activeStudent = await createStudentFixture({ agencyId: activeAgency.id });

    await request(app)
      .post("/api/v1/lessons")
      .send({
        studentId: inactiveStudent.id,
        startsAt: "2026-08-05T10:00:00Z",
        endsAt: "2026-08-05T11:00:00Z",
      })
      .expect(409);
    await request(app)
      .post("/api/v1/lessons")
      .send({
        studentId: activeStudent.id,
        agencyId: inactiveAgency.id,
        startsAt: "2026-08-05T10:00:00Z",
        endsAt: "2026-08-05T11:00:00Z",
      })
      .expect(409);

    await request(app)
      .post("/api/v1/lessons")
      .send({
        studentId: inactiveStudent.id,
        startsAt: "2026-08-05T10:00:00Z",
        endsAt: "2026-08-05T11:00:00Z",
        status: "COMPLETED",
      })
      .expect(201);
    await request(app)
      .post("/api/v1/lessons")
      .send({
        studentId: activeStudent.id,
        agencyId: inactiveAgency.id,
        startsAt: "2026-08-05T10:00:00Z",
        endsAt: "2026-08-05T11:00:00Z",
        status: "CANCELLED",
      })
      .expect(201);
  });

  it("revalidates planned lessons and allows their transition to history", async () => {
    const student = await createStudentFixture();
    const lesson = await createLessonFixture({
      studentId: student.id,
      agencyId: student.agencyId,
    });
    await prisma.student.update({
      where: { id: student.id },
      data: { isActive: false },
    });

    const blocked = await request(app)
      .patch(`/api/v1/lessons/${lesson.id}`)
      .send({ notes: "Must fail" })
      .expect(409);
    expect(bodyAs<ErrorBody>(blocked).error.code).toBe("STUDENT_INACTIVE");

    const completed = await request(app)
      .patch(`/api/v1/lessons/${lesson.id}`)
      .send({ status: "COMPLETED" })
      .expect(200);
    expect(bodyAs<DataBody<LessonResource>>(completed).data.status).toBe("COMPLETED");

    await request(app)
      .patch(`/api/v1/lessons/${lesson.id}`)
      .send({ notes: "Historical update" })
      .expect(200);
  });

  it("isolates owners and filters by period, student, agency and status", async () => {
    const agency = await createAgencyFixture();
    const otherAgency = await createAgencyFixture(OTHER_OWNER_ID);
    const student = await createStudentFixture({ agencyId: agency.id });
    const otherStudent = await createStudentFixture({
      ownerId: OTHER_OWNER_ID,
      agencyId: otherAgency.id,
    });
    const planned = await createLessonFixture({
      studentId: student.id,
      agencyId: agency.id,
      startsAt: new Date("2026-09-10T10:00:00Z"),
      endsAt: new Date("2026-09-10T11:00:00Z"),
    });
    await createLessonFixture({
      studentId: student.id,
      agencyId: agency.id,
      status: "COMPLETED",
      startsAt: new Date("2026-09-12T10:00:00Z"),
      endsAt: new Date("2026-09-12T11:00:00Z"),
    });
    const otherLesson = await createLessonFixture({
      ownerId: OTHER_OWNER_ID,
      studentId: otherStudent.id,
      agencyId: otherAgency.id,
    });

    await request(app).get(`/api/v1/lessons/${otherLesson.id}`).expect(404);

    const period = await request(app)
      .get("/api/v1/lessons")
      .query({
        from: "2026-09-10T00:00:00Z",
        to: "2026-09-11T00:00:00Z",
      })
      .expect(200);
    expect(bodyAs<DataBody<LessonResource[]>>(period).data.map(({ id }) => id)).toEqual([
      planned.id,
    ]);

    for (const query of [
      { studentId: student.id },
      { agencyId: agency.id },
      { status: "PLANNED" },
    ]) {
      const response = await request(app)
        .get("/api/v1/lessons")
        .query(query)
        .expect(200);
      expect(
        bodyAs<DataBody<LessonResource[]>>(response).data.some(
          ({ id }) => id === otherLesson.id,
        ),
      ).toBe(false);
    }
  });
});
