import { createFileRoute, redirect } from "@tanstack/react-router";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    const { data: session } = await authClient.getSession();

    throw redirect({
      replace: true,
      to: session ? "/dashboard" : "/auth/sign-in",
    });
  },
});
