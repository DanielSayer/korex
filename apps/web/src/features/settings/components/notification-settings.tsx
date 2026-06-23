import { SettingsSection } from "./settings-section";

function NotificationSettings() {
  return (
    <SettingsSection
      description="Korex does not send notifications yet."
      title="Notifications"
    >
      <div className="rounded-md border border-border/70 bg-muted/20 p-4">
        <p className="font-medium text-sm">No notification channels enabled</p>
        <p className="mt-1 text-muted-foreground text-sm">
          Activity imports, weekly summaries, and milestones are available in
          the app only.
        </p>
      </div>
    </SettingsSection>
  );
}

export { NotificationSettings };
