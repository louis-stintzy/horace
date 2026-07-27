import { z } from "zod";

const POSTGRESQL_SIGNED_INTEGER_MAX = 2_147_483_647;
const EXPLICIT_TIME_ZONE_SUFFIX = /(Z|[+-]\d{2}:\d{2})$/i;

const lessonStatusSchema = z.enum(["PLANNED", "COMPLETED", "CANCELLED"]);
const hourlyRateSchema = z
  .number()
  .int()
  .positive()
  .max(POSTGRESQL_SIGNED_INTEGER_MAX);
const notesSchema = z.string().trim().max(2_000).nullable();
const zonedDateTimeSchema = z
  .string()
  .datetime({ offset: true })
  .refine((value) => EXPLICIT_TIME_ZONE_SUFFIX.test(value), {
    message: "Date-time must include Z or an explicit UTC offset.",
  });

const hasValidTimeRange = (startsAt: string, endsAt: string): boolean =>
  new Date(endsAt).getTime() > new Date(startsAt).getTime();

export const lessonIdParamsSchema = z
  .object({
    id: z.uuid(),
  })
  .strict();

export const createLessonBodySchema = z
  .object({
    studentId: z.uuid(),
    agencyId: z.uuid().optional(),
    startsAt: zonedDateTimeSchema,
    endsAt: zonedDateTimeSchema,
    status: lessonStatusSchema.default("PLANNED"),
    hourlyRateCents: hourlyRateSchema.optional(),
    notes: notesSchema.optional(),
  })
  .strict()
  .refine((body) => hasValidTimeRange(body.startsAt, body.endsAt), {
    message: "endsAt must be strictly later than startsAt.",
    path: ["endsAt"],
  });

export const updateLessonBodySchema = z
  .object({
    studentId: z.uuid().optional(),
    agencyId: z.uuid().optional(),
    startsAt: zonedDateTimeSchema.optional(),
    endsAt: zonedDateTimeSchema.optional(),
    status: lessonStatusSchema.optional(),
    hourlyRateCents: hourlyRateSchema.optional(),
    notes: notesSchema.optional(),
  })
  .strict()
  .refine((body) => Object.keys(body).length > 0, {
    message: "At least one field must be provided.",
  })
  .refine(
    (body) =>
      body.startsAt === undefined ||
      body.endsAt === undefined ||
      hasValidTimeRange(body.startsAt, body.endsAt),
    {
      message: "endsAt must be strictly later than startsAt.",
      path: ["endsAt"],
    },
  );

export const listLessonsQuerySchema = z
  .object({
    from: zonedDateTimeSchema.optional(),
    to: zonedDateTimeSchema.optional(),
    studentId: z.uuid().optional(),
    agencyId: z.uuid().optional(),
    status: lessonStatusSchema.optional(),
  })
  .strict()
  .refine(
    (query) =>
      query.from === undefined ||
      query.to === undefined ||
      hasValidTimeRange(query.from, query.to),
    {
      message: "to must be strictly later than from.",
      path: ["to"],
    },
  );

export type LessonStatusInput = z.infer<typeof lessonStatusSchema>;
export type CreateLessonInput = z.infer<typeof createLessonBodySchema>;
export type UpdateLessonInput = z.infer<typeof updateLessonBodySchema>;
export type ListLessonsQuery = z.infer<typeof listLessonsQuerySchema>;
