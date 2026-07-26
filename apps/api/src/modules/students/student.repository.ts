import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../infrastructure/database/prisma.js";

export interface StudentAgencySummary {
  id: string;
  name: string;
}

export interface StudentRepresentativeSummary {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  relationship: string | null;
  isPrimary: boolean;
}

export interface StudentRecord {
  id: string;
  agencyId: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  defaultHourlyRateCents: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  agency: StudentAgencySummary;
}

export interface StudentDetailRecord extends StudentRecord {
  representatives: StudentRepresentativeSummary[];
}

export interface StudentRepresentativeData {
  representativeId: string;
  relationship?: string | null | undefined;
  isPrimary: boolean;
}

export interface CreateStudentData {
  agencyId: string;
  firstName: string;
  lastName: string;
  email?: string | null | undefined;
  phone?: string | null | undefined;
  notes?: string | null | undefined;
  defaultHourlyRateCents?: number | null | undefined;
  representatives?: StudentRepresentativeData[] | undefined;
}

export interface UpdateStudentData {
  agencyId?: string | undefined;
  firstName?: string | undefined;
  lastName?: string | undefined;
  email?: string | null | undefined;
  phone?: string | null | undefined;
  notes?: string | null | undefined;
  defaultHourlyRateCents?: number | null | undefined;
  isActive?: boolean | undefined;
}

export interface ListStudentsFilters {
  isActive?: boolean | undefined;
  agencyId?: string | undefined;
}

export class StudentNotFoundRepositoryError extends Error {
  constructor() {
    super("Student not found for this owner");
    this.name = "StudentNotFoundRepositoryError";
  }
}

export class StudentAgencyNotFoundRepositoryError extends Error {
  constructor() {
    super("Agency not found for this owner");
    this.name = "StudentAgencyNotFoundRepositoryError";
  }
}

export class StudentAgencyInactiveRepositoryError extends Error {
  constructor() {
    super("Agency is inactive");
    this.name = "StudentAgencyInactiveRepositoryError";
  }
}

export class StudentRepresentativeNotFoundRepositoryError extends Error {
  constructor() {
    super("At least one representative was not found for this owner");
    this.name = "StudentRepresentativeNotFoundRepositoryError";
  }
}

const agencySummarySelect = {
  id: true,
  name: true,
} as const;

const representativeSummarySelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
} as const;

const studentBaseSelect = {
  id: true,
  agencyId: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  notes: true,
  defaultHourlyRateCents: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  agency: {
    select: agencySummarySelect,
  },
} as const;

const studentDetailSelect = {
  ...studentBaseSelect,
  representatives: {
    orderBy: [{ isPrimary: "desc" }, { representativeId: "asc" }],
    select: {
      relationship: true,
      isPrimary: true,
      representative: {
        select: representativeSummarySelect,
      },
    },
  },
} satisfies Prisma.StudentSelect;

type TransactionClient = Prisma.TransactionClient;

const assertAgencyIsActive = async (
  transaction: TransactionClient,
  ownerId: string,
  agencyId: string,
): Promise<void> => {
  const agency = await transaction.agency.findUnique({
    where: {
      id_ownerId: {
        id: agencyId,
        ownerId,
      },
    },
    select: {
      isActive: true,
    },
  });

  if (!agency) {
    throw new StudentAgencyNotFoundRepositoryError();
  }

  if (!agency.isActive) {
    throw new StudentAgencyInactiveRepositoryError();
  }
};

const assertRepresentativesExist = async (
  transaction: TransactionClient,
  ownerId: string,
  representatives: StudentRepresentativeData[],
): Promise<void> => {
  if (representatives.length === 0) {
    return;
  }

  const representativeIds = representatives.map(({ representativeId }) => representativeId);
  const representativeCount = await transaction.representative.count({
    where: {
      ownerId,
      id: {
        in: representativeIds,
      },
    },
  });

  if (representativeCount !== representativeIds.length) {
    throw new StudentRepresentativeNotFoundRepositoryError();
  }
};

const mapStudentDetail = (student: {
  id: string;
  agencyId: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  defaultHourlyRateCents: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  agency: StudentAgencySummary;
  representatives: Array<{
    relationship: string | null;
    isPrimary: boolean;
    representative: {
      id: string;
      firstName: string;
      lastName: string;
      email: string | null;
      phone: string | null;
    };
  }>;
}): StudentDetailRecord => ({
  id: student.id,
  agencyId: student.agencyId,
  firstName: student.firstName,
  lastName: student.lastName,
  email: student.email,
  phone: student.phone,
  notes: student.notes,
  defaultHourlyRateCents: student.defaultHourlyRateCents,
  isActive: student.isActive,
  createdAt: student.createdAt,
  updatedAt: student.updatedAt,
  agency: student.agency,
  representatives: student.representatives.map(({ representative, ...association }) => ({
    ...representative,
    ...association,
  })),
});

const findDetailInTransaction = async (
  transaction: TransactionClient,
  ownerId: string,
  id: string,
): Promise<StudentDetailRecord> => {
  const student = await transaction.student.findUnique({
    where: {
      id_ownerId: {
        id,
        ownerId,
      },
    },
    select: studentDetailSelect,
  });

  if (!student) {
    throw new StudentNotFoundRepositoryError();
  }

  return mapStudentDetail(student);
};

export class StudentRepository {
  create(ownerId: string, data: CreateStudentData): Promise<StudentDetailRecord> {
    return prisma.$transaction(async (transaction) => {
      await assertAgencyIsActive(transaction, ownerId, data.agencyId);

      const representatives = data.representatives ?? [];
      await assertRepresentativesExist(transaction, ownerId, representatives);

      const student = await transaction.student.create({
        data: {
          ownerId,
          agencyId: data.agencyId,
          firstName: data.firstName,
          lastName: data.lastName,
          ...(data.email !== undefined ? { email: data.email } : {}),
          ...(data.phone !== undefined ? { phone: data.phone } : {}),
          ...(data.notes !== undefined ? { notes: data.notes } : {}),
          ...(data.defaultHourlyRateCents !== undefined
            ? { defaultHourlyRateCents: data.defaultHourlyRateCents }
            : {}),
        },
        select: {
          id: true,
        },
      });

      if (representatives.length > 0) {
        await transaction.studentRepresentative.createMany({
          data: representatives.map((representative) => ({
            ownerId,
            studentId: student.id,
            representativeId: representative.representativeId,
            ...(representative.relationship !== undefined
              ? { relationship: representative.relationship }
              : {}),
            isPrimary: representative.isPrimary,
          })),
        });
      }

      return findDetailInTransaction(transaction, ownerId, student.id);
    });
  }

  findMany(ownerId: string, filters: ListStudentsFilters): Promise<StudentRecord[]> {
    return prisma.student.findMany({
      where: {
        ownerId,
        ...(filters.isActive !== undefined ? { isActive: filters.isActive } : {}),
        ...(filters.agencyId !== undefined ? { agencyId: filters.agencyId } : {}),
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }, { id: "asc" }],
      select: studentBaseSelect,
    });
  }

  async findById(ownerId: string, id: string): Promise<StudentDetailRecord | null> {
    const student = await prisma.student.findUnique({
      where: {
        id_ownerId: {
          id,
          ownerId,
        },
      },
      select: studentDetailSelect,
    });

    return student ? mapStudentDetail(student) : null;
  }

  update(
    ownerId: string,
    id: string,
    data: UpdateStudentData,
  ): Promise<StudentDetailRecord> {
    return prisma.$transaction(async (transaction) => {
      const student = await transaction.student.findUnique({
        where: {
          id_ownerId: {
            id,
            ownerId,
          },
        },
        select: {
          id: true,
        },
      });

      if (!student) {
        throw new StudentNotFoundRepositoryError();
      }

      if (data.agencyId !== undefined) {
        await assertAgencyIsActive(transaction, ownerId, data.agencyId);
      }

      await transaction.student.update({
        where: {
          id_ownerId: {
            id,
            ownerId,
          },
        },
        data: {
          ...(data.agencyId !== undefined ? { agencyId: data.agencyId } : {}),
          ...(data.firstName !== undefined ? { firstName: data.firstName } : {}),
          ...(data.lastName !== undefined ? { lastName: data.lastName } : {}),
          ...(data.email !== undefined ? { email: data.email } : {}),
          ...(data.phone !== undefined ? { phone: data.phone } : {}),
          ...(data.notes !== undefined ? { notes: data.notes } : {}),
          ...(data.defaultHourlyRateCents !== undefined
            ? { defaultHourlyRateCents: data.defaultHourlyRateCents }
            : {}),
          ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
        },
      });

      return findDetailInTransaction(transaction, ownerId, id);
    });
  }

  replaceRepresentatives(
    ownerId: string,
    studentId: string,
    representatives: StudentRepresentativeData[],
  ): Promise<StudentDetailRecord> {
    return prisma.$transaction(async (transaction) => {
      const student = await transaction.student.findUnique({
        where: {
          id_ownerId: {
            id: studentId,
            ownerId,
          },
        },
        select: {
          id: true,
        },
      });

      if (!student) {
        throw new StudentNotFoundRepositoryError();
      }

      await assertRepresentativesExist(transaction, ownerId, representatives);

      await transaction.studentRepresentative.deleteMany({
        where: {
          ownerId,
          studentId,
        },
      });

      if (representatives.length > 0) {
        await transaction.studentRepresentative.createMany({
          data: representatives.map((representative) => ({
            ownerId,
            studentId,
            representativeId: representative.representativeId,
            ...(representative.relationship !== undefined
              ? { relationship: representative.relationship }
              : {}),
            isPrimary: representative.isPrimary,
          })),
        });
      }

      return findDetailInTransaction(transaction, ownerId, studentId);
    });
  }
}
