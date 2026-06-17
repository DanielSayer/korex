import { createFileRoute } from "@tanstack/react-router";
import { NotificationSettings } from "@/features/settings/components/notification-settings";
import { MobileSettingsBackLink } from "@/features/settings/components/settings-layout";

export const Route = createFileRoute("/_authenticated/settings/notifications")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="space-y-4">
      <MobileSettingsBackLink />
      <NotificationSettings />
    </div>
  );
}
