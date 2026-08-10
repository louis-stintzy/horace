import { z } from "zod";

import type { HealthResponse } from "./health.types";

export const healthResponseSchema: z.ZodType<HealthResponse> = z.strictObject({
  status: z.literal("ok"),
});
