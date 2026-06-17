import { createFileRoute } from "@tanstack/react-router";
import { SecuritySettings } from "@/features/settings/components/security-settings";
import { MobileSettingsBackLink } from "@/features/settings/components/settings-layout";

export const Route = createFileRoute("/_authenticated/settings/security")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="space-y-4">
      <MobileSettingsBackLink />
      <SecuritySettings />
    </div>
  );
}
