import { http, HttpResponse } from "msw";

export const handlers = [
  http.get("/api/v1/health", () => HttpResponse.json({ status: "ok" })),
  http.get("/api/v1/agencies", () => HttpResponse.json({ data: [] })),
];
