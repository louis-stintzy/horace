import { Router } from "express";

import { developmentRequestContext } from "../../shared/middleware/development-request-context.js";
import { StudentController } from "./student.controller.js";
import { StudentRepository } from "./student.repository.js";
import { StudentService } from "./student.service.js";

const studentRepository = new StudentRepository();
const studentService = new StudentService(studentRepository);
const studentController = new StudentController(studentService);

export const studentRouter = Router();

studentRouter.use(developmentRequestContext);
studentRouter.post("/", studentController.create);
studentRouter.get("/", studentController.list);
studentRouter.get("/:id", studentController.getById);
studentRouter.patch("/:id", studentController.update);
studentRouter.put("/:id/representatives", studentController.replaceRepresentatives);
