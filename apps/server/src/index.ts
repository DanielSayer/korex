import { createAuth } from "@korex/auth";
import { db, pool } from "@korex/db";
import { createServerApp } from "./app";
import { createServerRuntime, listenForHttp } from "./runtime";

const app = createServerApp({ auth: createAuth({ database: db }) });

const port = Number(process.env.PORT ?? 3000);
const runtime = createServerRuntime({
  fetch: app.fetch,
  hostname: "0.0.0.0",
  listen: listenForHttp,
  pool,
  port,
});

await runtime.start();

console.info(`Server listening on http://localhost:${port}`);

const shutdown = () => {
  runtime.stop().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
};

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);

export default app;
