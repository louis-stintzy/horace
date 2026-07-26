import type { RequestHandler } from "express";

import {
  createRepresentativeBodySchema,
  representativeIdParamsSchema,
  updateRepresentativeBodySchema,
} from "./representative.schemas.js";
import { RepresentativeService } from "./representative.service.js";

export class RepresentativeController {
  constructor(private readonly representativeService: RepresentativeService) {}

  create: RequestHandler = async (request, response) => {
    const input = createRepresentativeBodySchema.parse(request.body);
    const representative = await this.representativeService.create(
      request.context.ownerId,
      input,
    );

    response.status(201).json({ data: representative });
  };

  list: RequestHandler = async (request, response) => {
    const representatives = await this.representativeService.list(request.context.ownerId);

    response.status(200).json({ data: representatives });
  };

  getById: RequestHandler = async (request, response) => {
    const { id } = representativeIdParamsSchema.parse(request.params);
    const representative = await this.representativeService.getById(
      request.context.ownerId,
      id,
    );

    response.status(200).json({ data: representative });
  };

  update: RequestHandler = async (request, response) => {
    const { id } = representativeIdParamsSchema.parse(request.params);
    const input = updateRepresentativeBodySchema.parse(request.body);
    const representative = await this.representativeService.update(
      request.context.ownerId,
      id,
      input,
    );

    response.status(200).json({ data: representative });
  };
}
