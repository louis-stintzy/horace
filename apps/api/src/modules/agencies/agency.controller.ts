import type { RequestHandler } from "express";

import {
  agencyIdParamsSchema,
  createAgencyBodySchema,
  listAgenciesQuerySchema,
  updateAgencyBodySchema,
} from "./agency.schemas.js";
import { AgencyService } from "./agency.service.js";

export class AgencyController {
  constructor(private readonly agencyService: AgencyService) {}

  create: RequestHandler = async (request, response) => {
    const input = createAgencyBodySchema.parse(request.body);
    const agency = await this.agencyService.create(request.context.ownerId, input);

    response.status(201).json({ data: agency });
  };

  list: RequestHandler = async (request, response) => {
    const query = listAgenciesQuerySchema.parse(request.query);
    const agencies = await this.agencyService.list(request.context.ownerId, query.isActive);

    response.status(200).json({ data: agencies });
  };

  getById: RequestHandler = async (request, response) => {
    const { id } = agencyIdParamsSchema.parse(request.params);
    const agency = await this.agencyService.getById(request.context.ownerId, id);

    response.status(200).json({ data: agency });
  };

  update: RequestHandler = async (request, response) => {
    const { id } = agencyIdParamsSchema.parse(request.params);
    const input = updateAgencyBodySchema.parse(request.body);
    const agency = await this.agencyService.update(request.context.ownerId, id, input);

    response.status(200).json({ data: agency });
  };
}
