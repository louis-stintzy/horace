import type { RequestHandler } from "express";

import { env } from "../../config/env.js";

export const developmentRequestContext: RequestHandler = (request, _response, next) => {
  request.context = {
    ownerId: env.DEV_USER_ID,
  };
  next();
};
