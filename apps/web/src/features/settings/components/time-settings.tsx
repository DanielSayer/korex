import { MockField, SettingsSection } from "./settings-section";

function TimeSettings() {
  return (
    <SettingsSection
      description="Defaults for calendar grouping, training weeks, and date formatting."
      title="Time and Locale"
    >
      <div className="grid gap-5 sm:grid-cols-3">
        <MockField label="Timezone" value="Australia/Brisbane" />
        <MockField label="Week starts" value="Monday" />
        <MockField label="Date format" value="9 Jun 2026" />
      </div>
    </SettingsSection>
  );
}

export { TimeSettings };
