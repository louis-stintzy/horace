import { z } from "zod";

const EXPLICIT_TIME_ZONE_SUFFIX = /(Z|[+-]\d{2}:\d{2})$/i;

const zonedDateTimeSchema = z
  .string()
  .datetime({ offset: true })
  .refine((value) => EXPLICIT_TIME_ZONE_SUFFIX.test(value), {
    message: "Date-time must include Z or an explicit UTC offset.",
  });

const periodShape = {
  from: zonedDateTimeSchema,
  to: zonedDateTimeSchema,
} as const;

const lessonStatusSchema = z.enum(["PLANNED", "COMPLETED", "CANCELLED"]);

const hasValidPeriod = (from: string, to: string): boolean =>
  new Date(to).getTime() > new Date(from).getTime();

const periodRefinement = {
  message: "to must be strictly later than from.",
  path: ["to"],
};

export const statisticsSummaryQuerySchema = z
  .object({
    ...periodShape,
    studentId: z.uuid().optional(),
    agencyId: z.uuid().optional(),
  })
  .strict()
  .refine(({ from, to }) => hasValidPeriod(from, to), periodRefinement);

export const statisticsTimelineQuerySchema = z
  .object({
    ...periodShape,
    groupBy: z.enum(["day", "week", "month"]),
    status: lessonStatusSchema.default("COMPLETED"),
    studentId: z.uuid().optional(),
    agencyId: z.uuid().optional(),
  })
  .strict()
  .refine(({ from, to }) => hasValidPeriod(from, to), periodRefinement);

export const statisticsByStudentQuerySchema = z
  .object({
    ...periodShape,
    status: lessonStatusSchema.default("COMPLETED"),
    agencyId: z.uuid().optional(),
  })
  .strict()
  .refine(({ from, to }) => hasValidPeriod(from, to), periodRefinement);

export const statisticsByAgencyQuerySchema = z
  .object({
    ...periodShape,
    status: lessonStatusSchema.default("COMPLETED"),
    studentId: z.uuid().optional(),
  })
  .strict()
  .refine(({ from, to }) => hasValidPeriod(from, to), periodRefinement);

export type StatisticsStatus = z.infer<typeof lessonStatusSchema>;
export type StatisticsSummaryQuery = z.infer<typeof statisticsSummaryQuerySchema>;
export type StatisticsTimelineQuery = z.infer<typeof statisticsTimelineQuerySchema>;
export type StatisticsByStudentQuery = z.infer<
  typeof statisticsByStudentQuerySchema
>;
export type StatisticsByAgencyQuery = z.infer<typeof statisticsByAgencyQuerySchema>;
