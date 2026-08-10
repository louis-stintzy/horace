import { healthResponseSchema } from "./health.schema";
import type { HealthResponse } from "./health.types";
import { request } from "./http-client";

export function getHealth({ signal }: { signal?: AbortSignal } = {}) {
  return request<HealthResponse>("/health", {
    schema: healthResponseSchema,
    ...(signal === undefined ? {} : { signal }),
  });
}
