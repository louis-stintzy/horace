import { Router } from "express";

import { developmentRequestContext } from "../../shared/middleware/development-request-context.js";
import { StatisticsController } from "./statistics.controller.js";
import { StatisticsRepository } from "./statistics.repository.js";
import { StatisticsService } from "./statistics.service.js";

const statisticsRepository = new StatisticsRepository();
const statisticsService = new StatisticsService(statisticsRepository);
const statisticsController = new StatisticsController(statisticsService);

export const statisticsRouter = Router();

statisticsRouter.use(developmentRequestContext);
statisticsRouter.get("/summary", statisticsController.summary);
statisticsRouter.get("/timeline", statisticsController.timeline);
statisticsRouter.get("/by-student", statisticsController.byStudent);
statisticsRouter.get("/by-agency", statisticsController.byAgency);
