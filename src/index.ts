import { env } from "./config/env";
import { router } from "./lib/router";

const server = Bun.serve({
  port: env.PORT,
  fetch: router,
});

console.log(`[veda-be] listening on http://localhost:${server.port}`);
