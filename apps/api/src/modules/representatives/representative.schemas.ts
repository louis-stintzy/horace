import { z } from "zod";

const firstNameSchema = z.string().trim().min(1).max(100);
const lastNameSchema = z.string().trim().min(1).max(100);
const emailSchema = z.string().trim().email().max(254).nullable();
const phoneSchema = z.string().trim().min(1).max(50).nullable();
const notesSchema = z.string().trim().max(2_000).nullable();

export const representativeIdParamsSchema = z
  .object({
    id: z.uuid(),
  })
  .strict();

export const createRepresentativeBodySchema = z
  .object({
    firstName: firstNameSchema,
    lastName: lastNameSchema,
    email: emailSchema.optional(),
    phone: phoneSchema.optional(),
    notes: notesSchema.optional(),
  })
  .strict();

export const updateRepresentativeBodySchema = z
  .object({
    firstName: firstNameSchema.optional(),
    lastName: lastNameSchema.optional(),
    email: emailSchema.optional(),
    phone: phoneSchema.optional(),
    notes: notesSchema.optional(),
  })
  .strict()
  .refine((body) => Object.keys(body).length > 0, {
    message: "At least one field must be provided.",
  });

export type CreateRepresentativeInput = z.infer<typeof createRepresentativeBodySchema>;
export type UpdateRepresentativeInput = z.infer<typeof updateRepresentativeBodySchema>;
