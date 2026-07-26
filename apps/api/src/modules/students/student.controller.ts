import type { RequestHandler } from "express";

import {
  createStudentBodySchema,
  listStudentsQuerySchema,
  replaceStudentRepresentativesBodySchema,
  studentIdParamsSchema,
  updateStudentBodySchema,
} from "./student.schemas.js";
import { StudentService } from "./student.service.js";

export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  create: RequestHandler = async (request, response) => {
    const input = createStudentBodySchema.parse(request.body);
    const student = await this.studentService.create(request.context.ownerId, input);

    response.status(201).json({ data: student });
  };

  list: RequestHandler = async (request, response) => {
    const query = listStudentsQuerySchema.parse(request.query);
    const students = await this.studentService.list(request.context.ownerId, query);

    response.status(200).json({ data: students });
  };

  getById: RequestHandler = async (request, response) => {
    const { id } = studentIdParamsSchema.parse(request.params);
    const student = await this.studentService.getById(request.context.ownerId, id);

    response.status(200).json({ data: student });
  };

  update: RequestHandler = async (request, response) => {
    const { id } = studentIdParamsSchema.parse(request.params);
    const input = updateStudentBodySchema.parse(request.body);
    const student = await this.studentService.update(request.context.ownerId, id, input);

    response.status(200).json({ data: student });
  };

  replaceRepresentatives: RequestHandler = async (request, response) => {
    const { id } = studentIdParamsSchema.parse(request.params);
    const input = replaceStudentRepresentativesBodySchema.parse(request.body);
    const student = await this.studentService.replaceRepresentatives(
      request.context.ownerId,
      id,
      input,
    );

    response.status(200).json({ data: student });
  };
}
