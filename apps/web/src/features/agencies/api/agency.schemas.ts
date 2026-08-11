import { z } from "zod";

import type {
  Agency,
  AgencyListResponse,
  AgencyResponse,
  CreateAgencyInput,
  UpdateAgencyInput,
} from "../types";

const agencyNameSchema = z.string().trim().min(1).max(100).regex(/\S/);
const agencyNotesSchema = z.string().trim().max(2_000).nullable();

export const agencySchema: z.ZodType<Agency> = z.strictObject({
  id: z.uuid(),
  name: z.string().min(1).max(100).regex(/\S/),
  notes: z.string().max(2_000).nullable(),
  isActive: z.boolean(),
  createdAt: z.iso.datetime({ offset: true }),
  updatedAt: z.iso.datetime({ offset: true }),
});

export const agencyListResponseSchema: z.ZodType<AgencyListResponse> =
  z.strictObject({
    data: z.array(agencySchema),
  });

export const agencyResponseSchema: z.ZodType<AgencyResponse> = z.strictObject({
  data: agencySchema,
});

export const createAgencyInputSchema: z.ZodType<CreateAgencyInput> =
  z
    .strictObject({
      name: agencyNameSchema,
      notes: agencyNotesSchema.optional(),
    })
    .transform(
      (input): CreateAgencyInput => ({
        name: input.name,
        ...(input.notes === undefined ? {} : { notes: input.notes }),
      }),
    );

export const updateAgencyInputSchema: z.ZodType<UpdateAgencyInput> =
  z
    .strictObject({
      name: agencyNameSchema.optional(),
      notes: agencyNotesSchema.optional(),
      isActive: z.boolean().optional(),
    })
    .refine((input) => Object.keys(input).length > 0, {
      message: "Au moins une modification est requise.",
    })
    .transform(
      (input): UpdateAgencyInput => ({
        ...(input.name === undefined ? {} : { name: input.name }),
        ...(input.notes === undefined ? {} : { notes: input.notes }),
        ...(input.isActive === undefined ? {} : { isActive: input.isActive }),
      }),
    );
