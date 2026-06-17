import { createFileRoute } from "@tanstack/react-router";
import { ProfileSettings } from "@/features/settings/components/profile-settings";
import { MobileSettingsBackLink } from "@/features/settings/components/settings-layout";

export const Route = createFileRoute("/_authenticated/settings/profile")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="space-y-4">
      <MobileSettingsBackLink />
      <ProfileSettings />
    </div>
  );
}
