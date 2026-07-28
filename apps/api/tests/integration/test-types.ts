import type { Response } from "supertest";

export interface DataBody<T> {
  data: T;
}

export interface ErrorBody {
  error: {
    code: string;
    message: string;
  };
}

interface IdentifiedResource {
  id: string;
}

export interface AgencyResource extends IdentifiedResource {
  name: string;
  isActive: boolean;
}

export interface RepresentativeResource extends IdentifiedResource {
  email: string | null;
  phone: string | null;
  notes: string | null;
}

export interface StudentResource extends IdentifiedResource {
  agencyId: string;
  defaultHourlyRateCents: number | null;
  isActive: boolean;
  representatives: Array<{
    id: string;
    isPrimary: boolean;
  }>;
}

export interface LessonResource extends IdentifiedResource {
  studentId: string;
  agencyId: string;
  status: "PLANNED" | "COMPLETED" | "CANCELLED";
  hourlyRateCents: number;
  amountCents: number;
  notes: string | null;
}

export const bodyAs = <T>(response: Response): T => response.body as T;
