import express from "express";

import { prisma } from "./infrastructure/database/prisma.js";
import { errorHandler } from "./shared/middleware/error-handler.js";
import { notFound } from "./shared/middleware/not-found.js";

export const app = express();

app.disable("x-powered-by");
app.use(express.json());

app.get("/api/v1/health", async (_request, response) => {
  await prisma.$queryRaw`SELECT 1`;
  response.status(200).json({ status: "ok" });
});

app.use(notFound);
app.use(errorHandler);
