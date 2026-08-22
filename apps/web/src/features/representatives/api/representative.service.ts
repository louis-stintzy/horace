import { request } from "../../../shared/api/http-client";
import type {
  CreateRepresentativeInput,
  Representative,
  RepresentativeListResponse,
  RepresentativeResponse,
  UpdateRepresentativeInput,
} from "../types";
import {
  createRepresentativeInputSchema,
  representativeListResponseSchema,
  representativeResponseSchema,
  updateRepresentativeInputSchema,
} from "./representative.schemas";

export async function listRepresentatives({
  signal,
}: {
  signal?: AbortSignal;
} = {}): Promise<Representative[]> {
  const response = await request<RepresentativeListResponse>(
    "/representatives",
    {
      schema: representativeListResponseSchema,
      ...(signal === undefined ? {} : { signal }),
    },
  );

  return response.data;
}

export async function createRepresentative(
  input: CreateRepresentativeInput,
): Promise<Representative> {
  const validatedInput = createRepresentativeInputSchema.parse(input);
  const response = await request<RepresentativeResponse>("/representatives", {
    schema: representativeResponseSchema,
    method: "POST",
    body: validatedInput,
  });

  return response.data;
}

export async function updateRepresentative(
  id: string,
  input: UpdateRepresentativeInput,
): Promise<Representative> {
  const validatedInput = updateRepresentativeInputSchema.parse(input);
  const response = await request<RepresentativeResponse>(
    `/representatives/${encodeURIComponent(id)}`,
    {
      schema: representativeResponseSchema,
      method: "PATCH",
      body: validatedInput,
    },
  );

  return response.data;
}
