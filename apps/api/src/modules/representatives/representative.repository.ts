import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../infrastructure/database/prisma.js";

export interface RepresentativeRecord {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRepresentativeData {
  firstName: string;
  lastName: string;
  email?: string | null | undefined;
  phone?: string | null | undefined;
  notes?: string | null | undefined;
}

export interface UpdateRepresentativeData {
  firstName?: string | undefined;
  lastName?: string | undefined;
  email?: string | null | undefined;
  phone?: string | null | undefined;
  notes?: string | null | undefined;
}

const representativeSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
} as const;

export class RepresentativeRepository {
  create(ownerId: string, data: CreateRepresentativeData): Promise<RepresentativeRecord> {
    return prisma.representative.create({
      data: {
        ownerId,
        firstName: data.firstName,
        lastName: data.lastName,
        ...(data.email !== undefined ? { email: data.email } : {}),
        ...(data.phone !== undefined ? { phone: data.phone } : {}),
        ...(data.notes !== undefined ? { notes: data.notes } : {}),
      },
      select: representativeSelect,
    });
  }

  findMany(ownerId: string): Promise<RepresentativeRecord[]> {
    return prisma.representative.findMany({
      where: { ownerId },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }, { id: "asc" }],
      select: representativeSelect,
    });
  }

  findById(ownerId: string, id: string): Promise<RepresentativeRecord | null> {
    return prisma.representative.findUnique({
      where: {
        id_ownerId: {
          id,
          ownerId,
        },
      },
      select: representativeSelect,
    });
  }

  async update(
    ownerId: string,
    id: string,
    data: UpdateRepresentativeData,
  ): Promise<RepresentativeRecord | null> {
    try {
      return await prisma.representative.update({
        where: {
          id_ownerId: {
            id,
            ownerId,
          },
        },
        data: {
          ...(data.firstName !== undefined ? { firstName: data.firstName } : {}),
          ...(data.lastName !== undefined ? { lastName: data.lastName } : {}),
          ...(data.email !== undefined ? { email: data.email } : {}),
          ...(data.phone !== undefined ? { phone: data.phone } : {}),
          ...(data.notes !== undefined ? { notes: data.notes } : {}),
        },
        select: representativeSelect,
      });
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        return null;
      }

      throw error;
    }
  }
}
