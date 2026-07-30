import type { RequestHandler } from "express";

import {
  statisticsByAgencyQuerySchema,
  statisticsByStudentQuerySchema,
  statisticsSummaryQuerySchema,
  statisticsTimelineQuerySchema,
} from "./statistics.schemas.js";
import { StatisticsService } from "./statistics.service.js";

export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  summary: RequestHandler = async (request, response) => {
    const query = statisticsSummaryQuerySchema.parse(request.query);
    const statistics = await this.statisticsService.summary(
      request.context.ownerId,
      query,
    );

    response.status(200).json({ data: statistics });
  };

  timeline: RequestHandler = async (request, response) => {
    const query = statisticsTimelineQuerySchema.parse(request.query);
    const statistics = await this.statisticsService.timeline(
      request.context.ownerId,
      query,
    );

    response.status(200).json({ data: statistics });
  };

  byStudent: RequestHandler = async (request, response) => {
    const query = statisticsByStudentQuerySchema.parse(request.query);
    const statistics = await this.statisticsService.byStudent(
      request.context.ownerId,
      query,
    );

    response.status(200).json({ data: statistics });
  };

  byAgency: RequestHandler = async (request, response) => {
    const query = statisticsByAgencyQuerySchema.parse(request.query);
    const statistics = await this.statisticsService.byAgency(
      request.context.ownerId,
      query,
    );

    response.status(200).json({ data: statistics });
  };
}
