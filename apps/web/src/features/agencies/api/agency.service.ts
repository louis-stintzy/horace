import { request } from "../../../shared/api/http-client";
import type { Agency, AgencyListResponse } from "../types";

export async function listAgencies({
  signal,
}: {
  signal?: AbortSignal;
} = {}): Promise<Agency[]> {
  const response = await request<AgencyListResponse>("/agencies", {
    ...(signal === undefined ? {} : { signal }),
  });

  return response.data;
}
