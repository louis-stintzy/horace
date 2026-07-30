export interface ValidationDetail {
  path: string;
  message: string;
}

interface ApiErrorOptions {
  status?: number;
  code?: string;
  details?: ValidationDetail[];
  cause?: unknown;
}

export class ApiError extends Error {
  readonly status: number | undefined;
  readonly code: string | undefined;
  readonly details: ValidationDetail[] | undefined;

  constructor(message: string, options: ApiErrorOptions = {}) {
    super(message, { cause: options.cause });
    this.name = "ApiError";
    this.status = options.status;
    this.code = options.code;
    this.details = options.details;
  }

  get isNetworkError() {
    return this.status === undefined;
  }
}
