const TEST_DATABASE_NAME = "horace_test";
const DEFAULT_TEST_DATABASE_URL =
  "postgresql://horace_test:horace_test@localhost:5439/horace_test?schema=public";

process.env.NODE_ENV ??= "test";
process.env.DATABASE_URL ??= DEFAULT_TEST_DATABASE_URL;
process.env.APP_TIME_ZONE ??= "Europe/Paris";
process.env.APP_CURRENCY ??= "EUR";
process.env.DEV_USER_ID ??= "00000000-0000-4000-8000-000000000101";

export const assertSafeTestDatabase = (): void => {
  if (process.env.NODE_ENV !== "test") {
    throw new Error("Integration tests require NODE_ENV=test.");
  }

  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("Integration tests require DATABASE_URL.");
  }

  const databaseName = new URL(databaseUrl).pathname.slice(1);

  if (databaseName !== TEST_DATABASE_NAME) {
    throw new Error(
      `Refusing to use database "${databaseName}" for integration tests; expected "${TEST_DATABASE_NAME}".`,
    );
  }
};

assertSafeTestDatabase();
