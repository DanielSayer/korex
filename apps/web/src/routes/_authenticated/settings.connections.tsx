import { createFileRoute } from "@tanstack/react-router";
import { ProviderConnectionSettings } from "@/features/settings/components/provider-connection-settings";
import { MobileSettingsBackLink } from "@/features/settings/components/settings-layout";

export const Route = createFileRoute("/_authenticated/settings/connections")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="space-y-4">
      <MobileSettingsBackLink />
      <ProviderConnectionSettings />
    </div>
  );
}
