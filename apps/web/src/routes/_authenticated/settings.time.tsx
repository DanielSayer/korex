import { createFileRoute } from "@tanstack/react-router";
import {
  MockField,
  SettingsSection,
} from "@/features/settings/components/settings-section";

export const Route = createFileRoute("/_authenticated/settings/time")({
  component: RouteComponent,
});

function RouteComponent() {
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
