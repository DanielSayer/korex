import { createFileRoute } from "@tanstack/react-router";
import { TimeSettings } from "@/features/settings/components/time-settings";

export const Route = createFileRoute("/_authenticated/settings/time")({
  component: TimeSettings,
});
