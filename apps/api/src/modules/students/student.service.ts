import { AppError } from "../../shared/errors/app-error.js";
import {
  StudentAgencyInactiveRepositoryError,
  StudentAgencyNotFoundRepositoryError,
  type StudentDetailRecord,
  StudentNotFoundRepositoryError,
  type StudentRecord,
  StudentRepresentativeNotFoundRepositoryError,
  StudentRepository,
} from "./student.repository.js";
import type {
  CreateStudentInput,
  ReplaceStudentRepresentativesInput,
  UpdateStudentInput,
} from "./student.schemas.js";

export interface ListStudentsInput {
  isActive?: boolean | undefined;
  agencyId?: string | undefined;
}

export class StudentService {
  constructor(private readonly studentRepository: StudentRepository) {}

  async create(ownerId: string, input: CreateStudentInput): Promise<StudentDetailRecord> {
    try {
      return await this.studentRepository.create(ownerId, input);
    } catch (error: unknown) {
      this.rethrowRepositoryError(error);
    }
  }

  list(ownerId: string, filters: ListStudentsInput): Promise<StudentRecord[]> {
    return this.studentRepository.findMany(ownerId, filters);
  }

  async getById(ownerId: string, id: string): Promise<StudentDetailRecord> {
    const student = await this.studentRepository.findById(ownerId, id);

    if (!student) {
      throw new AppError("Student not found.", 404, "STUDENT_NOT_FOUND");
    }

    return student;
  }

  async update(
    ownerId: string,
    id: string,
    input: UpdateStudentInput,
  ): Promise<StudentDetailRecord> {
    try {
      return await this.studentRepository.update(ownerId, id, input);
    } catch (error: unknown) {
      this.rethrowRepositoryError(error);
    }
  }

  async replaceRepresentatives(
    ownerId: string,
    studentId: string,
    input: ReplaceStudentRepresentativesInput,
  ): Promise<StudentDetailRecord> {
    try {
      return await this.studentRepository.replaceRepresentatives(
        ownerId,
        studentId,
        input.representatives,
      );
    } catch (error: unknown) {
      this.rethrowRepositoryError(error);
    }
  }

  private rethrowRepositoryError(error: unknown): never {
    if (error instanceof StudentNotFoundRepositoryError) {
      throw new AppError("Student not found.", 404, "STUDENT_NOT_FOUND");
    }

    if (error instanceof StudentAgencyNotFoundRepositoryError) {
      throw new AppError("Agency not found.", 404, "AGENCY_NOT_FOUND");
    }

    if (error instanceof StudentAgencyInactiveRepositoryError) {
      throw new AppError(
        "An active agency is required.",
        409,
        "AGENCY_INACTIVE",
      );
    }

    if (error instanceof StudentRepresentativeNotFoundRepositoryError) {
      throw new AppError(
        "At least one representative was not found.",
        404,
        "REPRESENTATIVE_NOT_FOUND",
      );
    }

    throw error;
  }
}
