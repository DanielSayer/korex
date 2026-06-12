import { Button } from "@korex/ui/components/button";
import { SettingsSection } from "./settings-section";

function SecuritySettings() {
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

export { SecuritySettings };
