import { afterAll, beforeEach } from "vitest";

import "./test-environment.js";
import {
  cleanTestDatabase,
  disconnectTestDatabase,
  resetTestDatabase,
} from "./database.js";

beforeEach(async () => {
  await resetTestDatabase();
});

afterAll(async () => {
  await cleanTestDatabase();
  await disconnectTestDatabase();
});
