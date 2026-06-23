import { SettingsSection } from "./settings-section";

function TimeSettings() {
  const options = Intl.DateTimeFormat().resolvedOptions();
  const example = new Intl.DateTimeFormat(options.locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date());

  return (
    <SettingsSection
      description="Korex currently follows this browser for dates and times. Training Weeks always start on Monday."
      title="Time and Locale"
    >
      <dl className="grid gap-5 sm:grid-cols-3">
        <Preference label="Timezone" value={options.timeZone} />
        <Preference label="Week starts" value="Monday" />
        <Preference label="Date format" value={example} />
      </dl>
      <p className="mt-5 text-muted-foreground text-sm">
        Change your device or browser preferences to update these values.
      </p>
    </SettingsSection>
  );
}

function Preference({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border/70 p-4">
      <dt className="text-muted-foreground text-xs uppercase tracking-wide">
        {label}
      </dt>
      <dd className="mt-1 font-medium text-sm">{value}</dd>
    </div>
  );
}

export { TimeSettings };
