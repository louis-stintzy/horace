import request, { type Response } from "supertest";
import { describe, expect, it } from "vitest";

import { app } from "../../src/app.js";
import { prisma } from "../../src/infrastructure/database/prisma.js";
import { OTHER_OWNER_ID } from "./database.js";
import {
  createAgencyFixture,
  createLessonFixture,
  createRepresentativeFixture,
  createStudentFixture,
} from "./fixtures.js";

interface DataBody<T> {
  data: T;
}

interface ErrorBody {
  error: {
    code: string;
    message: string;
  };
}

interface IdentifiedResource {
  id: string;
}

interface AgencyResource extends IdentifiedResource {
  name: string;
  isActive: boolean;
}

interface RepresentativeResource extends IdentifiedResource {
  email: string | null;
  phone: string | null;
  notes: string | null;
}

interface StudentResource extends IdentifiedResource {
  agencyId: string;
  defaultHourlyRateCents: number | null;
  isActive: boolean;
  representatives: Array<{
    id: string;
    isPrimary: boolean;
  }>;
}

interface LessonResource extends IdentifiedResource {
  studentId: string;
  agencyId: string;
  status: "PLANNED" | "COMPLETED" | "CANCELLED";
  hourlyRateCents: number;
  amountCents: number;
  notes: string | null;
}

const bodyAs = <T>(response: Response): T => response.body as T;

describe("HTTP foundation", () => {
  it("returns health, not-found and validation responses in the expected format", async () => {
    await request(app).get("/api/v1/health").expect(200, { status: "ok" });

    const missingRoute = await request(app).get("/api/v1/unknown").expect(404);
    expect(bodyAs<ErrorBody>(missingRoute).error.code).toBe("NOT_FOUND");

    const invalidAgency = await request(app)
      .post("/api/v1/agencies")
      .send({})
      .expect(400);
    expect(bodyAs<ErrorBody>(invalidAgency).error.code).toBe("VALIDATION_ERROR");
  });
});

describe("agencies", () => {
  it("creates, lists and rejects a duplicate name", async () => {
    const created = await request(app)
      .post("/api/v1/agencies")
      .send({ name: "Integration Agency" })
      .expect(201);
    const agency = bodyAs<DataBody<AgencyResource>>(created).data;

    const listed = await request(app).get("/api/v1/agencies").expect(200);
    expect(bodyAs<DataBody<AgencyResource[]>>(listed).data).toEqual([
      expect.objectContaining({ id: agency.id, name: "Integration Agency" }),
    ]);

    const conflict = await request(app)
      .post("/api/v1/agencies")
      .send({ name: "Integration Agency" })
      .expect(409);
    expect(bodyAs<ErrorBody>(conflict).error.code).toBe("AGENCY_NAME_CONFLICT");
  });

  it("hides another owner's agency", async () => {
    const otherAgency = await createAgencyFixture(OTHER_OWNER_ID);

    const response = await request(app)
      .get(`/api/v1/agencies/${otherAgency.id}`)
      .expect(404);
    expect(bodyAs<ErrorBody>(response).error.code).toBe("AGENCY_NOT_FOUND");
  });

  it("blocks deactivation while a planned lesson exists", async () => {
    const agency = await createAgencyFixture();
    const student = await createStudentFixture({ agencyId: agency.id });
    const lesson = await createLessonFixture({
      studentId: student.id,
      agencyId: agency.id,
    });

    const blocked = await request(app)
      .patch(`/api/v1/agencies/${agency.id}`)
      .send({ isActive: false })
      .expect(409);
    expect(bodyAs<ErrorBody>(blocked).error.code).toBe(
      "AGENCY_HAS_PLANNED_LESSONS",
    );

    await request(app)
      .patch(`/api/v1/lessons/${lesson.id}`)
      .send({ status: "COMPLETED" })
      .expect(200);

    const deactivated = await request(app)
      .patch(`/api/v1/agencies/${agency.id}`)
      .send({ isActive: false })
      .expect(200);
    expect(bodyAs<DataBody<AgencyResource>>(deactivated).data.isActive).toBe(false);
  });
});

describe("representatives", () => {
  it("creates complete and minimal resources, then clears optional fields", async () => {
    const complete = await request(app)
      .post("/api/v1/representatives")
      .send({
        firstName: "Camille",
        lastName: "Martin",
        email: "camille@example.com",
        phone: "06 12 34 56 78",
        notes: "Parent",
      })
      .expect(201);
    const representative = bodyAs<DataBody<RepresentativeResource>>(complete).data;

    await request(app)
      .post("/api/v1/representatives")
      .send({ firstName: "Alex", lastName: "Durand" })
      .expect(201);

    const updated = await request(app)
      .patch(`/api/v1/representatives/${representative.id}`)
      .send({ email: null, phone: null, notes: null })
      .expect(200);
    expect(bodyAs<DataBody<RepresentativeResource>>(updated).data).toEqual(
      expect.objectContaining({ email: null, phone: null, notes: null }),
    );
  });

  it("hides another owner's representative", async () => {
    const representative = await createRepresentativeFixture(OTHER_OWNER_ID);

    const response = await request(app)
      .get(`/api/v1/representatives/${representative.id}`)
      .expect(404);
    expect(bodyAs<ErrorBody>(response).error.code).toBe(
      "REPRESENTATIVE_NOT_FOUND",
    );
  });
});

describe("students", () => {
  it("creates students without and with several representatives", async () => {
    const agency = await createAgencyFixture();
    const firstRepresentative = await createRepresentativeFixture();
    const secondRepresentative = await createRepresentativeFixture();

    const minimal = await request(app)
      .post("/api/v1/students")
      .send({
        agencyId: agency.id,
        firstName: "Lina",
        lastName: "Minimal",
      })
      .expect(201);
    expect(bodyAs<DataBody<StudentResource>>(minimal).data.representatives).toEqual([]);

    const complete = await request(app)
      .post("/api/v1/students")
      .send({
        agencyId: agency.id,
        firstName: "Nina",
        lastName: "Family",
        representatives: [
          {
            representativeId: firstRepresentative.id,
            relationship: "Mother",
            isPrimary: true,
          },
          {
            representativeId: secondRepresentative.id,
            relationship: "Father",
            isPrimary: false,
          },
        ],
      })
      .expect(201);
    expect(bodyAs<DataBody<StudentResource>>(complete).data.representatives).toHaveLength(2);
  });

  it("rejects several primary representatives", async () => {
    const agency = await createAgencyFixture();
    const firstRepresentative = await createRepresentativeFixture();
    const secondRepresentative = await createRepresentativeFixture();

    const response = await request(app)
      .post("/api/v1/students")
      .send({
        agencyId: agency.id,
        firstName: "Invalid",
        lastName: "Primaries",
        representatives: [
          { representativeId: firstRepresentative.id, isPrimary: true },
          { representativeId: secondRepresentative.id, isPrimary: true },
        ],
      })
      .expect(400);
    expect(bodyAs<ErrorBody>(response).error.code).toBe("VALIDATION_ERROR");
  });

  it("replaces representatives atomically", async () => {
    const agency = await createAgencyFixture();
    const initialRepresentative = await createRepresentativeFixture();
    const replacement = await createRepresentativeFixture();
    const student = await createStudentFixture({ agencyId: agency.id });

    await prisma.studentRepresentative.create({
      data: {
        ownerId: student.ownerId,
        studentId: student.id,
        representativeId: initialRepresentative.id,
        isPrimary: true,
      },
    });

    await request(app)
      .put(`/api/v1/students/${student.id}/representatives`)
      .send({
        representatives: [
          { representativeId: replacement.id, isPrimary: true },
          {
            representativeId: "00000000-0000-4000-8000-000000000199",
            isPrimary: false,
          },
        ],
      })
      .expect(404);

    const unchanged = await request(app)
      .get(`/api/v1/students/${student.id}`)
      .expect(200);
    expect(bodyAs<DataBody<StudentResource>>(unchanged).data.representatives).toEqual([
      expect.objectContaining({ id: initialRepresentative.id }),
    ]);

    const replaced = await request(app)
      .put(`/api/v1/students/${student.id}/representatives`)
      .send({
        representatives: [{ representativeId: replacement.id, isPrimary: true }],
      })
      .expect(200);
    expect(bodyAs<DataBody<StudentResource>>(replaced).data.representatives).toEqual([
      expect.objectContaining({ id: replacement.id, isPrimary: true }),
    ]);
  });

  it("hides another owner's student and protects students with planned lessons", async () => {
    const otherStudent = await createStudentFixture({ ownerId: OTHER_OWNER_ID });
    await request(app).get(`/api/v1/students/${otherStudent.id}`).expect(404);

    const agency = await createAgencyFixture();
    const student = await createStudentFixture({ agencyId: agency.id });
    const lesson = await createLessonFixture({
      studentId: student.id,
      agencyId: agency.id,
    });

    const blocked = await request(app)
      .patch(`/api/v1/students/${student.id}`)
      .send({ isActive: false })
      .expect(409);
    expect(bodyAs<ErrorBody>(blocked).error.code).toBe(
      "STUDENT_HAS_PLANNED_LESSONS",
    );

    await request(app)
      .patch(`/api/v1/lessons/${lesson.id}`)
      .send({ status: "CANCELLED" })
      .expect(200);
    const deactivated = await request(app)
      .patch(`/api/v1/students/${student.id}`)
      .send({ isActive: false })
      .expect(200);
    expect(bodyAs<DataBody<StudentResource>>(deactivated).data.isActive).toBe(false);
  });
});

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
