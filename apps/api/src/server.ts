import { app } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./infrastructure/database/prisma.js";

const server = app.listen(env.PORT, () => {
  console.log(`Horace API listening on http://localhost:${env.PORT}`);
});

let isShuttingDown = false;

const shutdown = async (signal: NodeJS.Signals): Promise<void> => {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  console.log(`${signal} received, shutting down`);

  server.close();
  server.closeAllConnections();
  await prisma.$disconnect();
  process.exit(0);
};

process.on("SIGINT", (signal) => {
  void shutdown(signal);
});
process.on("SIGTERM", (signal) => {
  void shutdown(signal);
});
