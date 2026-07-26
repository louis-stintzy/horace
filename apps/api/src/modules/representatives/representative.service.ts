import { AppError } from "../../shared/errors/app-error.js";
import { RepresentativeRepository } from "./representative.repository.js";
import type { RepresentativeRecord } from "./representative.repository.js";
import type {
  CreateRepresentativeInput,
  UpdateRepresentativeInput,
} from "./representative.schemas.js";

export class RepresentativeService {
  constructor(private readonly representativeRepository: RepresentativeRepository) {}

  create(ownerId: string, input: CreateRepresentativeInput): Promise<RepresentativeRecord> {
    return this.representativeRepository.create(ownerId, input);
  }

  list(ownerId: string): Promise<RepresentativeRecord[]> {
    return this.representativeRepository.findMany(ownerId);
  }

  async getById(ownerId: string, id: string): Promise<RepresentativeRecord> {
    const representative = await this.representativeRepository.findById(ownerId, id);

    if (!representative) {
      throw new AppError("Representative not found.", 404, "REPRESENTATIVE_NOT_FOUND");
    }

    return representative;
  }

  async update(
    ownerId: string,
    id: string,
    input: UpdateRepresentativeInput,
  ): Promise<RepresentativeRecord> {
    const representative = await this.representativeRepository.update(ownerId, id, input);

    if (!representative) {
      throw new AppError("Representative not found.", 404, "REPRESENTATIVE_NOT_FOUND");
    }

    return representative;
  }
}
