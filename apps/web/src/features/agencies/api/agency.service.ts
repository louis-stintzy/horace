import { request } from "../../../shared/api/http-client";
import type {
  Agency,
  AgencyListResponse,
  AgencyResponse,
  CreateAgencyInput,
  UpdateAgencyInput,
} from "../types";
import {
  agencyListResponseSchema,
  agencyResponseSchema,
  createAgencyInputSchema,
  updateAgencyInputSchema,
} from "./agency.schemas";

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

export async function createAgency(input: CreateAgencyInput): Promise<Agency> {
  const validatedInput = createAgencyInputSchema.parse(input);
  const response = await request<AgencyResponse>("/agencies", {
    schema: agencyResponseSchema,
    method: "POST",
    body: validatedInput,
  });

  return response.data;
}

export async function updateAgency(
  id: string,
  input: UpdateAgencyInput,
): Promise<Agency> {
  const validatedInput = updateAgencyInputSchema.parse(input);
  const response = await request<AgencyResponse>(
    `/agencies/${encodeURIComponent(id)}`,
    {
      schema: agencyResponseSchema,
      method: "PATCH",
      body: validatedInput,
    },
  );

  return response.data;
}
