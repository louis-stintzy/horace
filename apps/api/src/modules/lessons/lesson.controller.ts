import type { RequestHandler } from "express";

import {
  createLessonBodySchema,
  lessonIdParamsSchema,
  listLessonsQuerySchema,
  updateLessonBodySchema,
} from "./lesson.schemas.js";
import { LessonService } from "./lesson.service.js";

export class LessonController {
  constructor(private readonly lessonService: LessonService) {}

  create: RequestHandler = async (request, response) => {
    const input = createLessonBodySchema.parse(request.body);
    const lesson = await this.lessonService.create(request.context.ownerId, input);

    response.status(201).json({ data: lesson });
  };

  list: RequestHandler = async (request, response) => {
    const query = listLessonsQuerySchema.parse(request.query);
    const lessons = await this.lessonService.list(request.context.ownerId, query);

    response.status(200).json({ data: lessons });
  };

  getById: RequestHandler = async (request, response) => {
    const { id } = lessonIdParamsSchema.parse(request.params);
    const lesson = await this.lessonService.getById(request.context.ownerId, id);

    response.status(200).json({ data: lesson });
  };

  update: RequestHandler = async (request, response) => {
    const { id } = lessonIdParamsSchema.parse(request.params);
    const input = updateLessonBodySchema.parse(request.body);
    const lesson = await this.lessonService.update(request.context.ownerId, id, input);

    response.status(200).json({ data: lesson });
  };
}
