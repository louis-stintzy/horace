import { z } from "zod";

const POSTGRESQL_SIGNED_INTEGER_MAX = 2_147_483_647;

const firstNameSchema = z.string().trim().min(1).max(100);
const lastNameSchema = z.string().trim().min(1).max(100);
const emailSchema = z.string().trim().email().max(254).nullable();
const phoneSchema = z.string().trim().min(1).max(50).nullable();
const notesSchema = z.string().trim().max(2_000).nullable();
const hourlyRateSchema = z
  .number()
  .int()
  .positive()
  .max(POSTGRESQL_SIGNED_INTEGER_MAX)
  .nullable();
const relationshipSchema = z.string().trim().min(1).max(100).nullable();

const representativeAssociationSchema = z
  .object({
    representativeId: z.uuid(),
    relationship: relationshipSchema.optional(),
    isPrimary: z.boolean().default(false),
  })
  .strict();

const representativeAssociationsSchema = z.array(representativeAssociationSchema).superRefine(
  (associations, context) => {
    const representativeIds = new Set<string>();
    let primaryCount = 0;

    associations.forEach((association, index) => {
      if (representativeIds.has(association.representativeId)) {
        context.addIssue({
          code: "custom",
          message: "Representative identifiers must be unique.",
          path: [index, "representativeId"],
        });
      }

      representativeIds.add(association.representativeId);

      if (association.isPrimary) {
        primaryCount += 1;
      }
    });

    if (primaryCount > 1) {
      context.addIssue({
        code: "custom",
        message: "Only one representative can be primary.",
      });
    }
  },
);

export const studentIdParamsSchema = z
  .object({
    id: z.uuid(),
  })
  .strict();

export const listStudentsQuerySchema = z
  .object({
    isActive: z
      .enum(["true", "false"])
      .transform((value) => value === "true")
      .optional(),
    agencyId: z.uuid().optional(),
  })
  .strict();

export const createStudentBodySchema = z
  .object({
    agencyId: z.uuid(),
    firstName: firstNameSchema,
    lastName: lastNameSchema,
    email: emailSchema.optional(),
    phone: phoneSchema.optional(),
    notes: notesSchema.optional(),
    defaultHourlyRateCents: hourlyRateSchema.optional(),
    representatives: representativeAssociationsSchema.optional(),
  })
  .strict();

export const updateStudentBodySchema = z
  .object({
    agencyId: z.uuid().optional(),
    firstName: firstNameSchema.optional(),
    lastName: lastNameSchema.optional(),
    email: emailSchema.optional(),
    phone: phoneSchema.optional(),
    notes: notesSchema.optional(),
    defaultHourlyRateCents: hourlyRateSchema.optional(),
    isActive: z.boolean().optional(),
  })
  .strict()
  .refine((body) => Object.keys(body).length > 0, {
    message: "At least one field must be provided.",
  });

export const replaceStudentRepresentativesBodySchema = z
  .object({
    representatives: representativeAssociationsSchema,
  })
  .strict();

export type RepresentativeAssociationInput = z.infer<
  typeof representativeAssociationSchema
>;
export type CreateStudentInput = z.infer<typeof createStudentBodySchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentBodySchema>;
export type ReplaceStudentRepresentativesInput = z.infer<
  typeof replaceStudentRepresentativesBodySchema
>;
