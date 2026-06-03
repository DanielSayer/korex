import { createFileRoute } from "@tanstack/react-router";
import { HeartRateZonesSettings } from "@/features/settings/components/heart-rate-zones-settings";

export const Route = createFileRoute("/_authenticated/settings")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-semibold text-2xl tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm">
          Manage your user-owned training configuration.
        </p>
      </div>
      <HeartRateZonesSettings />
    </div>
  );
}
