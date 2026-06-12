import { createFileRoute } from "@tanstack/react-router";
import { SecuritySettings } from "@/features/settings/components/security-settings";

export const Route = createFileRoute("/_authenticated/settings/security")({
  component: SecuritySettings,
});
