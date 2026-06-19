import { createContext } from "@korex/api/context";
import {
  ActivityRouteHeatmapTileInputError,
  readActivityRouteHeatmapDisplayMode,
  readActivityRouteHeatmapTileInput,
  renderActivityRouteHeatmapTile,
  renderEmptyActivityRouteHeatmapTile,
} from "@korex/api/modules/activities/route-heatmap/activity-route-heatmap-tile";
import { appRouter } from "@korex/api/routers/index";
import { auth } from "@korex/auth";
import { env } from "@korex/env/server";
import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { OpenAPIReferencePlugin } from "@orpc/openapi/plugins";
import { onError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

const app = new Hono();

app.use(logger());
app.use(
  "/*",
  cors({
    origin: env.CORS_ORIGIN,
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

app.get(
  "/api/activities/route-heatmap/tiles/:zoom/:tileX/:tileY",
  async (c) => {
    const context = await createContext({ context: c });

    if (!context.session?.user) {
      return c.body(null, 401);
    }

    try {
      const tileInput = readActivityRouteHeatmapTileInput({
        tileX: c.req.param("tileX"),
        tileY: c.req.param("tileY"),
        zoom: c.req.param("zoom"),
      });

      if (!tileInput) {
        return routeHeatmapTileResponse(renderEmptyActivityRouteHeatmapTile());
      }

      const tile = await renderActivityRouteHeatmapTile({
        displayMode: readActivityRouteHeatmapDisplayMode(c.req.query("mode")),
        tileX: tileInput.tileX,
        tileY: tileInput.tileY,
        userId: context.session.user.id,
        zoom: tileInput.zoom,
      });

      return routeHeatmapTileResponse(tile);
    } catch (error) {
      if (error instanceof ActivityRouteHeatmapTileInputError) {
        return routeHeatmapTileResponse(renderEmptyActivityRouteHeatmapTile());
      }

      console.error(error);
      return c.text("Could not render route heatmap tile", 500);
    }
  },
);

export const apiHandler = new OpenAPIHandler(appRouter, {
  plugins: [
    new OpenAPIReferencePlugin({
      schemaConverters: [new ZodToJsonSchemaConverter()],
    }),
  ],
  interceptors: [
    onError((error) => {
      console.error(error);
    }),
  ],
});

export const rpcHandler = new RPCHandler(appRouter, {
  interceptors: [
    onError((error) => {
      console.error(error);
    }),
  ],
});

app.use("/*", async (c, next) => {
  const context = await createContext({ context: c });

  const rpcResult = await rpcHandler.handle(c.req.raw, {
    prefix: "/rpc",
    context: context,
  });

  if (rpcResult.matched) {
    return c.newResponse(rpcResult.response.body, rpcResult.response);
  }

  const apiResult = await apiHandler.handle(c.req.raw, {
    prefix: "/api-reference",
    context: context,
  });

  if (apiResult.matched) {
    return c.newResponse(apiResult.response.body, apiResult.response);
  }

  await next();
});

app.get("/", (c) => {
  return c.text("OK");
});

const port = Number(process.env.PORT ?? 3000);

Bun.serve({
  fetch: app.fetch,
  hostname: "0.0.0.0",
  port,
});

console.info(`Server listening on port ${port}`);

export default app;

function routeHeatmapTileResponse(tile: Buffer) {
  return new Response(tile, {
    headers: {
      "Cache-Control": "private, max-age=3600",
      "Content-Type": "image/png",
    },
  });
}
