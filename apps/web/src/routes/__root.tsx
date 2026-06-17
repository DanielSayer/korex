import type { AppRouterClient } from "@korex/api/routers/index";
import { Toaster } from "@korex/ui/components/sonner";
import { TooltipProvider } from "@korex/ui/components/tooltip";
import { createORPCClient } from "@orpc/client";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import type { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { useState } from "react";

import { PwaUpdatePrompt } from "@/components/pwa-update-prompt";
import { ThemeProvider } from "@/components/theme-provider";
import { link, type orpc } from "@/utils/orpc";

import "../index.css";

export interface RouterAppContext {
  orpc: typeof orpc;
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
  component: RootComponent,
  head: () => ({
    meta: [
      {
        title: "Korex",
      },
      {
        name: "description",
        content: "Training analysis and planning for Korex athletes.",
      },
    ],
  }),
});

function RootComponent() {
  const [client] = useState<AppRouterClient>(() => createORPCClient(link));
  const [_orpcUtils] = useState(() => createTanstackQueryUtils(client));

  return (
    <>
      <HeadContent />
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        disableTransitionOnChange
        storageKey="vite-ui-theme"
      >
        <TooltipProvider>
          <div className="grid h-svh grid-rows-[auto_1fr]">
            <Outlet />
          </div>
        </TooltipProvider>
        <Toaster richColors />
        <PwaUpdatePrompt />
      </ThemeProvider>
      <TanStackRouterDevtools position="bottom-left" />
      <ReactQueryDevtools position="bottom" buttonPosition="bottom-right" />
    </>
  );
}
