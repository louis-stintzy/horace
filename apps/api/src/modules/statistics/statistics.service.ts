import { AppError } from "../../shared/errors/app-error.js";
import {
  StatisticsAgencyNotFoundRepositoryError,
  type StatisticsAggregate,
  type StatisticsByAgencyRow,
  type StatisticsByStudentRow,
  StatisticsOwnerNotFoundRepositoryError,
  StatisticsRepository,
  StatisticsStudentNotFoundRepositoryError,
  type StatisticsTimelineRow,
} from "./statistics.repository.js";
import type {
  StatisticsByAgencyQuery,
  StatisticsByStudentQuery,
  StatisticsStatus,
  StatisticsSummaryQuery,
  StatisticsTimelineQuery,
} from "./statistics.schemas.js";

interface StatisticsPeriod {
  from: string;
  to: string;
  timeZone: string;
}

interface StatisticsSummaryPeriod extends StatisticsPeriod {
  currency: string;
}

interface StatisticsSummaryResult {
  period: StatisticsSummaryPeriod;
  byStatus: Record<StatisticsStatus, StatisticsAggregate>;
}

interface StatisticsTimelineResult {
  period: StatisticsPeriod;
  groupBy: StatisticsTimelineQuery["groupBy"];
  status: StatisticsStatus;
  items: StatisticsTimelineRow[];
}

interface StatisticsByStudentResult {
  period: StatisticsPeriod;
  status: StatisticsStatus;
  items: StatisticsByStudentRow[];
}

interface StatisticsByAgencyResult {
  period: StatisticsPeriod;
  status: StatisticsStatus;
  items: StatisticsByAgencyRow[];
}

const emptyAggregate = (): StatisticsAggregate => ({
  lessonCount: 0,
  durationMinutes: 0,
  amountCents: 0,
});

const normalizedPeriod = (
  query: { from: string; to: string },
  timeZone: string,
): StatisticsPeriod => ({
  from: new Date(query.from).toISOString(),
  to: new Date(query.to).toISOString(),
  timeZone,
});

export class StatisticsService {
  constructor(private readonly statisticsRepository: StatisticsRepository) {}

  async summary(
    ownerId: string,
    query: StatisticsSummaryQuery,
  ): Promise<StatisticsSummaryResult> {
    try {
      const context = await this.statisticsRepository.getOwnerContext(ownerId, query);
      const rows = await this.statisticsRepository.summarize(ownerId, {
        from: new Date(query.from),
        to: new Date(query.to),
        studentId: query.studentId,
        agencyId: query.agencyId,
      });
      const byStatus: Record<StatisticsStatus, StatisticsAggregate> = {
        PLANNED: emptyAggregate(),
        COMPLETED: emptyAggregate(),
        CANCELLED: emptyAggregate(),
      };

      for (const { status, ...aggregate } of rows) {
        byStatus[status] = aggregate;
      }

      return {
        period: {
          ...normalizedPeriod(query, context.timeZone),
          currency: context.currency,
        },
        byStatus,
      };
    } catch (error: unknown) {
      this.rethrowRepositoryError(error);
    }
  }

  async timeline(
    ownerId: string,
    query: StatisticsTimelineQuery,
  ): Promise<StatisticsTimelineResult> {
    try {
      const context = await this.statisticsRepository.getOwnerContext(ownerId, query);
      const items = await this.statisticsRepository.timeline(
        ownerId,
        {
          from: new Date(query.from),
          to: new Date(query.to),
          studentId: query.studentId,
          agencyId: query.agencyId,
        },
        query.groupBy,
        query.status,
        context.timeZone,
      );

      return {
        period: normalizedPeriod(query, context.timeZone),
        groupBy: query.groupBy,
        status: query.status,
        items,
      };
    } catch (error: unknown) {
      this.rethrowRepositoryError(error);
    }
  }

  async byStudent(
    ownerId: string,
    query: StatisticsByStudentQuery,
  ): Promise<StatisticsByStudentResult> {
    try {
      const context = await this.statisticsRepository.getOwnerContext(ownerId, query);
      const items = await this.statisticsRepository.byStudent(
        ownerId,
        {
          from: new Date(query.from),
          to: new Date(query.to),
          agencyId: query.agencyId,
        },
        query.status,
      );

      return {
        period: normalizedPeriod(query, context.timeZone),
        status: query.status,
        items,
      };
    } catch (error: unknown) {
      this.rethrowRepositoryError(error);
    }
  }

  async byAgency(
    ownerId: string,
    query: StatisticsByAgencyQuery,
  ): Promise<StatisticsByAgencyResult> {
    try {
      const context = await this.statisticsRepository.getOwnerContext(ownerId, query);
      const items = await this.statisticsRepository.byAgency(
        ownerId,
        {
          from: new Date(query.from),
          to: new Date(query.to),
          studentId: query.studentId,
        },
        query.status,
      );

      return {
        period: normalizedPeriod(query, context.timeZone),
        status: query.status,
        items,
      };
    } catch (error: unknown) {
      this.rethrowRepositoryError(error);
    }
  }

  private rethrowRepositoryError(error: unknown): never {
    if (error instanceof StatisticsStudentNotFoundRepositoryError) {
      throw new AppError("Student not found.", 404, "STUDENT_NOT_FOUND");
    }

    if (error instanceof StatisticsAgencyNotFoundRepositoryError) {
      throw new AppError("Agency not found.", 404, "AGENCY_NOT_FOUND");
    }

    if (error instanceof StatisticsOwnerNotFoundRepositoryError) {
      throw new AppError("User not found.", 404, "USER_NOT_FOUND");
    }

    throw error;
  }
}
