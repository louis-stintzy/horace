import request from "supertest";
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
import {
  bodyAs,
  type DataBody,
  type ErrorBody,
  type StudentResource,
} from "./test-types.js";

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
