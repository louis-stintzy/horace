import { AppError } from "../../shared/errors/app-error.js";
import {
  LessonAgencyInactiveRepositoryError,
  LessonAgencyNotFoundRepositoryError,
  LessonAmountOutOfRangeRepositoryError,
  LessonHourlyRateRequiredRepositoryError,
  LessonInvalidTimeRangeRepositoryError,
  LessonNotFoundRepositoryError,
  type LessonRecord,
  LessonRepository,
  LessonStudentInactiveRepositoryError,
  LessonStudentNotFoundRepositoryError,
} from "./lesson.repository.js";
import type {
  CreateLessonInput,
  ListLessonsQuery,
  UpdateLessonInput,
} from "./lesson.schemas.js";

export class LessonService {
  constructor(private readonly lessonRepository: LessonRepository) {}

  async create(ownerId: string, input: CreateLessonInput): Promise<LessonRecord> {
    try {
      return await this.lessonRepository.create(ownerId, input);
    } catch (error: unknown) {
      this.rethrowRepositoryError(error);
    }
  }

  list(ownerId: string, filters: ListLessonsQuery): Promise<LessonRecord[]> {
    return this.lessonRepository.findMany(ownerId, filters);
  }

  async getById(ownerId: string, id: string): Promise<LessonRecord> {
    const lesson = await this.lessonRepository.findById(ownerId, id);

    if (!lesson) {
      throw new AppError("Lesson not found.", 404, "LESSON_NOT_FOUND");
    }

    return lesson;
  }

  async update(
    ownerId: string,
    id: string,
    input: UpdateLessonInput,
  ): Promise<LessonRecord> {
    try {
      return await this.lessonRepository.update(ownerId, id, input);
    } catch (error: unknown) {
      this.rethrowRepositoryError(error);
    }
  }

  private rethrowRepositoryError(error: unknown): never {
    if (error instanceof LessonNotFoundRepositoryError) {
      throw new AppError("Lesson not found.", 404, "LESSON_NOT_FOUND");
    }

    if (error instanceof LessonStudentNotFoundRepositoryError) {
      throw new AppError("Student not found.", 404, "STUDENT_NOT_FOUND");
    }

    if (error instanceof LessonAgencyNotFoundRepositoryError) {
      throw new AppError("Agency not found.", 404, "AGENCY_NOT_FOUND");
    }

    if (error instanceof LessonStudentInactiveRepositoryError) {
      throw new AppError(
        "An active student is required for a planned lesson.",
        409,
        "STUDENT_INACTIVE",
      );
    }

    if (error instanceof LessonAgencyInactiveRepositoryError) {
      throw new AppError(
        "An active agency is required for a planned lesson.",
        409,
        "AGENCY_INACTIVE",
      );
    }

    if (error instanceof LessonHourlyRateRequiredRepositoryError) {
      throw new AppError(
        "An explicit or student default hourly rate is required.",
        409,
        "HOURLY_RATE_REQUIRED",
      );
    }

    if (error instanceof LessonInvalidTimeRangeRepositoryError) {
      throw new AppError(
        "endsAt must be strictly later than startsAt.",
        400,
        "INVALID_LESSON_TIME_RANGE",
      );
    }

    if (error instanceof LessonAmountOutOfRangeRepositoryError) {
      throw new AppError(
        "The calculated amount exceeds the supported range.",
        409,
        "AMOUNT_OUT_OF_RANGE",
      );
    }

    throw error;
  }
}
