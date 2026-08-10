import { z } from "zod";

import type { Agency, AgencyListResponse } from "../types";

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
