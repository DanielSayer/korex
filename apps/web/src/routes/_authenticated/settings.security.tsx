import { Button } from "@korex/ui/components/button";
import { createFileRoute } from "@tanstack/react-router";
import { SettingsSection } from "@/features/settings/components/settings-section";

export const Route = createFileRoute("/_authenticated/settings/security")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <SettingsSection
      description="Security controls and sign-in behavior placeholders."
      title="Security"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-medium text-sm">Password and sessions</p>
          <p className="text-muted-foreground text-sm">
            Manage password changes, active sessions, and recovery methods.
          </p>
        </div>
        <Button type="button" variant="outline">
          Manage access
        </Button>
      </div>
    </SettingsSection>
  );
}
