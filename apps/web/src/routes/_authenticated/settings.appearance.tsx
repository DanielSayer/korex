import { createFileRoute } from "@tanstack/react-router";
import { AppearanceSettings } from "@/features/settings/components/appearance-settings";
import { MobileSettingsBackLink } from "@/features/settings/components/settings-layout";

export const Route = createFileRoute("/_authenticated/settings/appearance")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="space-y-4">
      <MobileSettingsBackLink />
      <AppearanceSettings />
    </div>
  );
}
