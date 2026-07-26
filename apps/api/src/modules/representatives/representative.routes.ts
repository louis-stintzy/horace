import { Router } from "express";

import { developmentRequestContext } from "../../shared/middleware/development-request-context.js";
import { RepresentativeController } from "./representative.controller.js";
import { RepresentativeRepository } from "./representative.repository.js";
import { RepresentativeService } from "./representative.service.js";

const representativeRepository = new RepresentativeRepository();
const representativeService = new RepresentativeService(representativeRepository);
const representativeController = new RepresentativeController(representativeService);

export const representativeRouter = Router();

representativeRouter.use(developmentRequestContext);
representativeRouter.post("/", representativeController.create);
representativeRouter.get("/", representativeController.list);
representativeRouter.get("/:id", representativeController.getById);
representativeRouter.patch("/:id", representativeController.update);
