import { createFileRoute } from "@tanstack/react-router";
import { MobileSettingsBackLink } from "@/features/settings/components/settings-layout";
import { TimeSettings } from "@/features/settings/components/time-settings";

export const Route = createFileRoute("/_authenticated/settings/time")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="space-y-4">
      <MobileSettingsBackLink />
      <TimeSettings />
    </div>
  );
}
