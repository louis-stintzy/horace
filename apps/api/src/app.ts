import express from "express";

import { prisma } from "./infrastructure/database/prisma.js";
import { agencyRouter } from "./modules/agencies/agency.routes.js";
import { lessonRouter } from "./modules/lessons/lesson.routes.js";
import { representativeRouter } from "./modules/representatives/representative.routes.js";
import { studentRouter } from "./modules/students/student.routes.js";
import { errorHandler } from "./shared/middleware/error-handler.js";
import { notFound } from "./shared/middleware/not-found.js";

export const app = express();

app.disable("x-powered-by");
app.use(express.json());

app.get("/api/v1/health", async (_request, response) => {
  await prisma.$queryRaw`SELECT 1`;
  response.status(200).json({ status: "ok" });
});

app.use("/api/v1/agencies", agencyRouter);
app.use("/api/v1/lessons", lessonRouter);
app.use("/api/v1/representatives", representativeRouter);
app.use("/api/v1/students", studentRouter);

app.use(notFound);
app.use(errorHandler);
