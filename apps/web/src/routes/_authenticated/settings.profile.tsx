import { createFileRoute } from "@tanstack/react-router";
import {
  MockField,
  SettingsSection,
} from "@/features/settings/components/settings-section";

export const Route = createFileRoute("/_authenticated/settings/profile")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <SettingsSection
      description="Basic profile details used across the training workspace."
      title="Profile"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <MockField label="Display name" value="Daniel" />
        <MockField label="Handle" value="@daniel" />
        <MockField label="Primary email" value="daniel@example.com" />
        <MockField label="Location" value="Brisbane, Australia" />
      </div>
    </SettingsSection>
  );
}
