import { prisma } from "../../infrastructure/database/prisma.js";
import { Prisma } from "../../generated/prisma/client.js";

export interface AgencyRecord {
  id: string;
  name: string;
  notes: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAgencyData {
  name: string;
  notes?: string | null | undefined;
}

export interface UpdateAgencyData {
  name?: string | undefined;
  notes?: string | null | undefined;
  isActive?: boolean | undefined;
}

export class AgencyNameConflictRepositoryError extends Error {
  constructor() {
    super("Agency name already exists for this owner");
    this.name = "AgencyNameConflictRepositoryError";
  }
}

const agencySelect = {
  id: true,
  name: true,
  notes: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

const translateWriteError = (error: unknown): never => {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    throw new AgencyNameConflictRepositoryError();
  }

  throw error;
};

export class AgencyRepository {
  async create(ownerId: string, data: CreateAgencyData): Promise<AgencyRecord> {
    try {
      return await prisma.agency.create({
        data: {
          ownerId,
          name: data.name,
          ...(data.notes !== undefined ? { notes: data.notes } : {}),
        },
        select: agencySelect,
      });
    } catch (error: unknown) {
      return translateWriteError(error);
    }
  }

  async findMany(ownerId: string, isActive?: boolean): Promise<AgencyRecord[]> {
    return prisma.agency.findMany({
      where: isActive === undefined ? { ownerId } : { ownerId, isActive },
      orderBy: [{ name: "asc" }, { id: "asc" }],
      select: agencySelect,
    });
  }

  async findById(ownerId: string, id: string): Promise<AgencyRecord | null> {
    return prisma.agency.findUnique({
      where: {
        id_ownerId: {
          id,
          ownerId,
        },
      },
      select: agencySelect,
    });
  }

  async update(
    ownerId: string,
    id: string,
    data: UpdateAgencyData,
  ): Promise<AgencyRecord | null> {
    try {
      return await prisma.agency.update({
        where: {
          id_ownerId: {
            id,
            ownerId,
          },
        },
        data: {
          ...(data.name !== undefined ? { name: data.name } : {}),
          ...(data.notes !== undefined ? { notes: data.notes } : {}),
          ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
        },
        select: agencySelect,
      });
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        return null;
      }

      return translateWriteError(error);
    }
  }
}
