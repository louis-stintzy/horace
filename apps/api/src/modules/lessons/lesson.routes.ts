import { Router } from "express";

import { developmentRequestContext } from "../../shared/middleware/development-request-context.js";
import { LessonController } from "./lesson.controller.js";
import { LessonRepository } from "./lesson.repository.js";
import { LessonService } from "./lesson.service.js";

const lessonRepository = new LessonRepository();
const lessonService = new LessonService(lessonRepository);
const lessonController = new LessonController(lessonService);

export const lessonRouter = Router();

lessonRouter.use(developmentRequestContext);
lessonRouter.post("/", lessonController.create);
lessonRouter.get("/", lessonController.list);
lessonRouter.get("/:id", lessonController.getById);
lessonRouter.patch("/:id", lessonController.update);
