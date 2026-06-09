import { Checkbox } from "@korex/ui/components/checkbox";
import { Label } from "@korex/ui/components/label";
import { createFileRoute } from "@tanstack/react-router";
import { useId } from "react";
import { SettingsSection } from "@/features/settings/components/settings-section";

export const Route = createFileRoute("/_authenticated/settings/appearance")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <SettingsSection
      description="Mock display controls that can later map to saved user preferences."
      title="Appearance"
    >
      <div className="grid gap-5 md:grid-cols-3">
        <MockChoice
          checked
          description="Follow the system dark or light mode."
          label="System theme"
        />
        <MockChoice
          description="Use compact tables and reduced vertical spacing."
          label="Dense dashboard"
        />
        <MockChoice
          description="Prefer kilometers and metric training values."
          label="Metric units"
        />
      </div>
    </SettingsSection>
  );
}

function MockChoice({
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
    <div className="flex min-h-28 flex-col justify-between gap-4 border-border/70 border-l pl-4">
      <div>
        <Label className="font-medium text-sm" htmlFor={id}>
          {label}
        </Label>
        <p className="mt-1 text-muted-foreground text-sm leading-5">
          {description}
        </p>
      </div>
      <Checkbox defaultChecked={checked} id={id} />
    </div>
  );
}
