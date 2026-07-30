import { ApiError, type ValidationDetail } from "./api-error";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api/v1";

type QueryValue = boolean | number | string | null | undefined;

interface RequestOptions {
  method?: "DELETE" | "GET" | "PATCH" | "POST" | "PUT";
  query?: Record<string, QueryValue>;
  body?: unknown;
  signal?: AbortSignal;
}

interface ErrorPayload {
  error?: {
    code?: unknown;
    message?: unknown;
    details?: unknown;
  };
}

function buildUrl(path: string, query?: Record<string, QueryValue>) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null) {
      searchParams.set(key, String(value));
    }
  }

  const queryString = searchParams.toString();
  return `${API_BASE_URL}${normalizedPath}${queryString ? `?${queryString}` : ""}`;
}

async function readPayload(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return undefined;
  }

  const text = await response.text();
  if (!text) {
    return undefined;
  }

  if (!response.headers.get("content-type")?.includes("application/json")) {
    return text;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return undefined;
  }
}

function getValidationDetails(value: unknown): ValidationDetail[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const values: unknown[] = value;
  const details = values.filter(
    (detail): detail is ValidationDetail =>
      typeof detail === "object" &&
      detail !== null &&
      "path" in detail &&
      typeof detail.path === "string" &&
      "message" in detail &&
      typeof detail.message === "string",
  );

  return details.length > 0 ? details : undefined;
}

function toApiError(response: Response, payload: unknown) {
  const errorPayload =
    typeof payload === "object" && payload !== null
      ? (payload as ErrorPayload).error
      : undefined;
  const code =
    typeof errorPayload?.code === "string" ? errorPayload.code : undefined;
  const details = getValidationDetails(errorPayload?.details);
  const message =
    typeof errorPayload?.message === "string"
      ? errorPayload.message
      : `La requête a échoué (${response.status}).`;

  return new ApiError(message, {
    status: response.status,
    ...(code === undefined ? {} : { code }),
    ...(details === undefined ? {} : { details }),
  });
}

export async function request<TResponse>(
  path: string,
  options: RequestOptions = {},
): Promise<TResponse> {
  const hasBody = options.body !== undefined;
  let response: Response;

  try {
    response = await fetch(buildUrl(path, options.query), {
      method: options.method ?? "GET",
      ...(hasBody
        ? {
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(options.body),
          }
        : {}),
      ...(options.signal === undefined ? {} : { signal: options.signal }),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }

    throw new ApiError("Impossible de contacter l’API.", { cause: error });
  }

  const payload = await readPayload(response);
  if (!response.ok) {
    throw toApiError(response, payload);
  }

  return payload as TResponse;
}
