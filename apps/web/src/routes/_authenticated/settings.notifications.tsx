import { createFileRoute } from "@tanstack/react-router";
import { NotificationSettings } from "@/features/settings/components/notification-settings";

export const Route = createFileRoute("/_authenticated/settings/notifications")({
  component: NotificationSettings,
});
