import { z } from "zod";

import type {
  CreateRepresentativeInput,
  Representative,
  RepresentativeListResponse,
  RepresentativeResponse,
  UpdateRepresentativeInput,
} from "../types";

const nameSchema = z.string().trim().min(1).max(100).regex(/\S/);
const emailSchema = z.email().max(254).nullable();
const phoneSchema = z.string().trim().min(1).max(50).regex(/\S/).nullable();
const notesSchema = z.string().trim().max(2_000).nullable();

export const representativeSchema: z.ZodType<Representative> = z.strictObject({
  id: z.uuid(),
  firstName: z.string().min(1).max(100).regex(/\S/),
  lastName: z.string().min(1).max(100).regex(/\S/),
  email: z.email().max(254).nullable(),
  phone: z.string().min(1).max(50).regex(/\S/).nullable(),
  notes: z.string().max(2_000).nullable(),
  createdAt: z.iso.datetime({ offset: true }),
  updatedAt: z.iso.datetime({ offset: true }),
});

export const representativeResponseSchema: z.ZodType<RepresentativeResponse> =
  z.strictObject({ data: representativeSchema });

export const representativeListResponseSchema: z.ZodType<RepresentativeListResponse> =
  z.strictObject({ data: z.array(representativeSchema) });

export const createRepresentativeInputSchema: z.ZodType<CreateRepresentativeInput> =
  z
    .strictObject({
      firstName: nameSchema,
      lastName: nameSchema,
      email: emailSchema.optional(),
      phone: phoneSchema.optional(),
      notes: notesSchema.optional(),
    })
    .transform(
      (input): CreateRepresentativeInput => ({
        firstName: input.firstName,
        lastName: input.lastName,
        ...(input.email === undefined ? {} : { email: input.email }),
        ...(input.phone === undefined ? {} : { phone: input.phone }),
        ...(input.notes === undefined ? {} : { notes: input.notes }),
      }),
    );

export const updateRepresentativeInputSchema: z.ZodType<UpdateRepresentativeInput> =
  z
    .strictObject({
      firstName: nameSchema.optional(),
      lastName: nameSchema.optional(),
      email: emailSchema.optional(),
      phone: phoneSchema.optional(),
      notes: notesSchema.optional(),
    })
    .refine(
      (input) => Object.values(input).some((value) => value !== undefined),
      { message: "Au moins une modification est requise." },
    )
    .transform(
      (input): UpdateRepresentativeInput => ({
        ...(input.firstName === undefined
          ? {}
          : { firstName: input.firstName }),
        ...(input.lastName === undefined ? {} : { lastName: input.lastName }),
        ...(input.email === undefined ? {} : { email: input.email }),
        ...(input.phone === undefined ? {} : { phone: input.phone }),
        ...(input.notes === undefined ? {} : { notes: input.notes }),
      }),
    );
