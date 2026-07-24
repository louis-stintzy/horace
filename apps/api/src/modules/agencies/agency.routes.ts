import { Router } from "express";

import { developmentRequestContext } from "../../shared/middleware/development-request-context.js";
import { AgencyController } from "./agency.controller.js";
import { AgencyRepository } from "./agency.repository.js";
import { AgencyService } from "./agency.service.js";

const agencyRepository = new AgencyRepository();
const agencyService = new AgencyService(agencyRepository);
const agencyController = new AgencyController(agencyService);

export const agencyRouter = Router();

agencyRouter.use(developmentRequestContext);
agencyRouter.post("/", agencyController.create);
agencyRouter.get("/", agencyController.list);
agencyRouter.get("/:id", agencyController.getById);
agencyRouter.patch("/:id", agencyController.update);
