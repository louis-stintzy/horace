import { AppError } from "../../shared/errors/app-error.js";
import type { CreateAgencyInput, UpdateAgencyInput } from "./agency.schemas.js";
import {
  AgencyNameConflictRepositoryError,
  type AgencyRecord,
  AgencyRepository,
} from "./agency.repository.js";

export class AgencyService {
  constructor(private readonly agencyRepository: AgencyRepository) {}

  async create(ownerId: string, input: CreateAgencyInput): Promise<AgencyRecord> {
    try {
      return await this.agencyRepository.create(ownerId, input);
    } catch (error: unknown) {
      this.rethrowRepositoryError(error);
    }
  }

  list(ownerId: string, isActive?: boolean): Promise<AgencyRecord[]> {
    return this.agencyRepository.findMany(ownerId, isActive);
  }

  async getById(ownerId: string, id: string): Promise<AgencyRecord> {
    const agency = await this.agencyRepository.findById(ownerId, id);

    if (!agency) {
      throw new AppError("Agency not found.", 404, "AGENCY_NOT_FOUND");
    }

    return agency;
  }

  async update(ownerId: string, id: string, input: UpdateAgencyInput): Promise<AgencyRecord> {
    try {
      const agency = await this.agencyRepository.update(ownerId, id, input);

      if (!agency) {
        throw new AppError("Agency not found.", 404, "AGENCY_NOT_FOUND");
      }

      return agency;
    } catch (error: unknown) {
      this.rethrowRepositoryError(error);
    }
  }

  private rethrowRepositoryError(error: unknown): never {
    if (error instanceof AgencyNameConflictRepositoryError) {
      throw new AppError(
        "An agency with this name already exists.",
        409,
        "AGENCY_NAME_CONFLICT",
      );
    }

    throw error;
  }
}
