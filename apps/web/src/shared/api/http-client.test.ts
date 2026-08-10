import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { server } from "../../test/mocks/server";
import { ApiError } from "./api-error";
import { request } from "./http-client";

describe("client HTTP", () => {
  it("rejette une réponse JSON invalide avec une ApiError", async () => {
    server.use(
      http.get("/api/v1/broken-json", () =>
        HttpResponse.text('{"data":', {
          headers: {
            "Content-Type": "application/json",
          },
          status: 200,
        }),
      ),
    );

    try {
      await request<unknown>("/broken-json");
      expect.unreachable("La requête aurait dû échouer.");
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(ApiError);
      expect(error).toMatchObject({
        message: "L’API a renvoyé une réponse JSON invalide.",
        status: 200,
      });
    }
  });
});
