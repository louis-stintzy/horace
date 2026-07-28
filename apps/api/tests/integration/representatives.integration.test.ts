import request from "supertest";
import { describe, expect, it } from "vitest";

import { app } from "../../src/app.js";
import { OTHER_OWNER_ID } from "./database.js";
import { createRepresentativeFixture } from "./fixtures.js";
import {
  bodyAs,
  type DataBody,
  type ErrorBody,
  type RepresentativeResource,
} from "./test-types.js";

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
