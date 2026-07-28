import request from "supertest";
import { describe, expect, it } from "vitest";

import { app } from "../../src/app.js";
import { bodyAs, type ErrorBody } from "./test-types.js";

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
