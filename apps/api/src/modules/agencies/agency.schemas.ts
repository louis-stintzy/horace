import { z } from "zod";

const agencyNameSchema = z.string().trim().min(1).max(100);
const agencyNotesSchema = z.string().trim().max(2_000).nullable();

export const agencyIdParamsSchema = z
  .object({
    id: z.uuid(),
  })
  .strict();

export const listAgenciesQuerySchema = z
  .object({
    isActive: z
      .enum(["true", "false"])
      .transform((value) => value === "true")
      .optional(),
  })
  .strict();

export const createAgencyBodySchema = z
  .object({
    name: agencyNameSchema,
    notes: agencyNotesSchema.optional(),
  })
  .strict();

export const updateAgencyBodySchema = z
  .object({
    name: agencyNameSchema.optional(),
    notes: agencyNotesSchema.optional(),
    isActive: z.boolean().optional(),
  })
  .strict()
  .refine((body) => Object.keys(body).length > 0, {
    message: "At least one field must be provided.",
  });

export type CreateAgencyInput = z.infer<typeof createAgencyBodySchema>;
export type UpdateAgencyInput = z.infer<typeof updateAgencyBodySchema>;
