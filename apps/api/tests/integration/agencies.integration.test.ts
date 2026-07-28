import request from "supertest";
import { describe, expect, it } from "vitest";

import { app } from "../../src/app.js";
import { OTHER_OWNER_ID } from "./database.js";
import {
  createAgencyFixture,
  createLessonFixture,
  createStudentFixture,
} from "./fixtures.js";
import {
  type AgencyResource,
  bodyAs,
  type DataBody,
  type ErrorBody,
} from "./test-types.js";

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
