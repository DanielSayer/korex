import { createFileRoute } from "@tanstack/react-router";
import { HeartRateZonesSettings } from "@/features/settings/components/heart-rate-zones-settings";

export const Route = createFileRoute("/_authenticated/settings/training")({
  component: HeartRateZonesSettings,
});
