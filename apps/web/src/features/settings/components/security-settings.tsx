import { SettingsSection } from "./settings-section";

function SecuritySettings() {
  return (
    <SettingsSection
      description="Korex currently supports email and password sign-in."
      title="Security"
    >
      <div className="rounded-md border border-border/70 bg-muted/20 p-4">
        <p className="font-medium text-sm">Account access</p>
        <p className="mt-1 text-muted-foreground text-sm">
          Password changes, session management, and recovery controls are not
          available in the app yet.
        </p>
      </div>
    </SettingsSection>
  );
}

export { SecuritySettings };
