import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../infrastructure/database/prisma.js";
import type {
  CreateLessonInput,
  LessonStatusInput,
  ListLessonsQuery,
  UpdateLessonInput,
} from "./lesson.schemas.js";

const POSTGRESQL_SIGNED_INTEGER_MAX = 2_147_483_647;
const MILLISECONDS_PER_HOUR = 3_600_000;

export interface LessonResourceSummary {
  id: string;
  name: string;
}

export interface LessonStudentSummary {
  id: string;
  firstName: string;
  lastName: string;
}

export interface LessonRecord {
  id: string;
  studentId: string;
  agencyId: string;
  startsAt: Date;
  endsAt: Date;
  status: LessonStatusInput;
  hourlyRateCents: number;
  amountCents: number;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  student: LessonStudentSummary;
  agency: LessonResourceSummary;
}

export class LessonNotFoundRepositoryError extends Error {}
export class LessonStudentNotFoundRepositoryError extends Error {}
export class LessonAgencyNotFoundRepositoryError extends Error {}
export class LessonStudentInactiveRepositoryError extends Error {}
export class LessonAgencyInactiveRepositoryError extends Error {}
export class LessonHourlyRateRequiredRepositoryError extends Error {}
export class LessonInvalidTimeRangeRepositoryError extends Error {}
export class LessonAmountOutOfRangeRepositoryError extends Error {}

const lessonSelect = {
  id: true,
  studentId: true,
  agencyId: true,
  startsAt: true,
  endsAt: true,
  status: true,
  hourlyRateCents: true,
  amountCents: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
  student: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
    },
  },
  agency: {
    select: {
      id: true,
      name: true,
    },
  },
} satisfies Prisma.LessonSelect;

type TransactionClient = Prisma.TransactionClient;

interface StudentSnapshotSource {
  id: string;
  agencyId: string;
  defaultHourlyRateCents: number | null;
  isActive: boolean;
}

interface AgencySnapshotSource {
  id: string;
  isActive: boolean;
}

const findStudent = async (
  transaction: TransactionClient,
  ownerId: string,
  studentId: string,
): Promise<StudentSnapshotSource> => {
  const student = await transaction.student.findUnique({
    where: {
      id_ownerId: {
        id: studentId,
        ownerId,
      },
    },
    select: {
      id: true,
      agencyId: true,
      defaultHourlyRateCents: true,
      isActive: true,
    },
  });

  if (!student) {
    throw new LessonStudentNotFoundRepositoryError();
  }

  return student;
};

const findAgency = async (
  transaction: TransactionClient,
  ownerId: string,
  agencyId: string,
): Promise<AgencySnapshotSource> => {
  const agency = await transaction.agency.findUnique({
    where: {
      id_ownerId: {
        id: agencyId,
        ownerId,
      },
    },
    select: {
      id: true,
      isActive: true,
    },
  });

  if (!agency) {
    throw new LessonAgencyNotFoundRepositoryError();
  }

  return agency;
};

const calculateAmount = (
  startsAt: Date,
  endsAt: Date,
  hourlyRateCents: number,
  status: LessonStatusInput,
): number => {
  const durationMilliseconds = endsAt.getTime() - startsAt.getTime();

  if (durationMilliseconds <= 0) {
    throw new LessonInvalidTimeRangeRepositoryError();
  }

  if (status === "CANCELLED") {
    return 0;
  }

  const amountCents = Math.round(
    (durationMilliseconds * hourlyRateCents) / MILLISECONDS_PER_HOUR,
  );

  if (
    !Number.isSafeInteger(amountCents) ||
    amountCents > POSTGRESQL_SIGNED_INTEGER_MAX
  ) {
    throw new LessonAmountOutOfRangeRepositoryError();
  }

  return amountCents;
};

const assertResourcesAreActive = (
  student: StudentSnapshotSource,
  agency: AgencySnapshotSource,
): void => {
  if (!student.isActive) {
    throw new LessonStudentInactiveRepositoryError();
  }

  if (!agency.isActive) {
    throw new LessonAgencyInactiveRepositoryError();
  }
};

export class LessonRepository {
  create(ownerId: string, data: CreateLessonInput): Promise<LessonRecord> {
    return prisma.$transaction(async (transaction) => {
      const student = await findStudent(transaction, ownerId, data.studentId);
      const agency = await findAgency(
        transaction,
        ownerId,
        data.agencyId ?? student.agencyId,
      );
      const hourlyRateCents = data.hourlyRateCents ?? student.defaultHourlyRateCents;

      if (hourlyRateCents === null) {
        throw new LessonHourlyRateRequiredRepositoryError();
      }

      if (data.status === "PLANNED") {
        assertResourcesAreActive(student, agency);
      }

      const startsAt = new Date(data.startsAt);
      const endsAt = new Date(data.endsAt);
      const amountCents = calculateAmount(
        startsAt,
        endsAt,
        hourlyRateCents,
        data.status,
      );

      return transaction.lesson.create({
        data: {
          ownerId,
          studentId: student.id,
          agencyId: agency.id,
          startsAt,
          endsAt,
          status: data.status,
          hourlyRateCents,
          amountCents,
          ...(data.notes !== undefined ? { notes: data.notes } : {}),
        },
        select: lessonSelect,
      });
    });
  }

  findMany(ownerId: string, filters: ListLessonsQuery): Promise<LessonRecord[]> {
    return prisma.lesson.findMany({
      where: {
        ownerId,
        ...(filters.from !== undefined || filters.to !== undefined
          ? {
              startsAt: {
                ...(filters.from !== undefined ? { gte: new Date(filters.from) } : {}),
                ...(filters.to !== undefined ? { lt: new Date(filters.to) } : {}),
              },
            }
          : {}),
        ...(filters.studentId !== undefined ? { studentId: filters.studentId } : {}),
        ...(filters.agencyId !== undefined ? { agencyId: filters.agencyId } : {}),
        ...(filters.status !== undefined ? { status: filters.status } : {}),
      },
      orderBy: [{ startsAt: "asc" }, { id: "asc" }],
      select: lessonSelect,
    });
  }

  findById(ownerId: string, id: string): Promise<LessonRecord | null> {
    return prisma.lesson.findUnique({
      where: {
        id,
        ownerId,
      },
      select: lessonSelect,
    });
  }

  update(
    ownerId: string,
    id: string,
    data: UpdateLessonInput,
  ): Promise<LessonRecord> {
    return prisma.$transaction(async (transaction) => {
      const lesson = await transaction.lesson.findUnique({
        where: {
          id,
          ownerId,
        },
        select: {
          studentId: true,
          agencyId: true,
          startsAt: true,
          endsAt: true,
          status: true,
          hourlyRateCents: true,
        },
      });

      if (!lesson) {
        throw new LessonNotFoundRepositoryError();
      }

      const studentId = data.studentId ?? lesson.studentId;
      const student = await findStudent(transaction, ownerId, studentId);
      const studentChanged = studentId !== lesson.studentId;
      const agencyId =
        data.agencyId ?? (studentChanged ? student.agencyId : lesson.agencyId);
      const agency = await findAgency(transaction, ownerId, agencyId);
      const hourlyRateCents =
        data.hourlyRateCents ??
        (studentChanged ? student.defaultHourlyRateCents : lesson.hourlyRateCents);

      if (hourlyRateCents === null) {
        throw new LessonHourlyRateRequiredRepositoryError();
      }

      const status = data.status ?? lesson.status;

      if (status === "PLANNED") {
        assertResourcesAreActive(student, agency);
      }

      const startsAt = data.startsAt ? new Date(data.startsAt) : lesson.startsAt;
      const endsAt = data.endsAt ? new Date(data.endsAt) : lesson.endsAt;
      const amountCents = calculateAmount(startsAt, endsAt, hourlyRateCents, status);

      return transaction.lesson.update({
        where: {
          id,
          ownerId,
        },
        data: {
          studentId,
          agencyId,
          startsAt,
          endsAt,
          status,
          hourlyRateCents,
          amountCents,
          ...(data.notes !== undefined ? { notes: data.notes } : {}),
        },
        select: lessonSelect,
      });
    });
  }
}
