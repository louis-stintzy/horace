import type { components } from "./generated/schema";
import { request } from "./http-client";

export type HealthResponse = components["schemas"]["HealthResponse"];

export function getHealth({ signal }: { signal?: AbortSignal } = {}) {
  return request<HealthResponse>("/health", {
    ...(signal === undefined ? {} : { signal }),
  });
}
