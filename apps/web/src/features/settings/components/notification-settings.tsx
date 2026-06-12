import { Checkbox } from "@korex/ui/components/checkbox";
import { Label } from "@korex/ui/components/label";
import { useId } from "react";
import { SettingsSection } from "./settings-section";

function NotificationSettings() {
  return (
    <SettingsSection
      description="Choose which workflow events should surface in the app."
      title="Notifications"
    >
      <div className="divide-y">
        <MockPreference
          checked
          description="Show when new activities are imported from a provider."
          label="Activity sync results"
        />
        <MockPreference
          checked
          description="Show when weekly summaries are generated."
          label="Weekly training summaries"
        />
        <MockPreference
          description="Show when a best effort or streak changes."
          label="Training milestones"
        />
      </div>
    </SettingsSection>
  );
}

function MockPreference({
  checked,
  description,
  label,
}: {
  checked?: boolean;
  description: string;
  label: string;
}) {
  const id = useId();

  return (
    <div className="flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0">
      <span>
        <Label className="block font-medium text-sm" htmlFor={id}>
          {label}
        </Label>
        <span className="mt-1 block text-muted-foreground text-sm">
          {description}
        </span>
      </span>
      <Checkbox defaultChecked={checked} id={id} />
    </div>
  );
}

export { NotificationSettings };
