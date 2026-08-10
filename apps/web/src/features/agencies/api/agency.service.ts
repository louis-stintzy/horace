import { request } from "../../../shared/api/http-client";
import type { Agency, AgencyListResponse } from "../types";
import { agencyListResponseSchema } from "./agency.schemas";

export async function listAgencies({
  signal,
}: {
  signal?: AbortSignal;
} = {}): Promise<Agency[]> {
  const response = await request<AgencyListResponse>("/agencies", {
    schema: agencyListResponseSchema,
    ...(signal === undefined ? {} : { signal }),
  });

  return response.data;
}
