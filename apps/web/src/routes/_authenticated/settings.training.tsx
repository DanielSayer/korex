import { createFileRoute } from "@tanstack/react-router";
import { EquipmentSettings } from "@/features/settings/components/equipment-settings";
import { HeartRateZonesSettings } from "@/features/settings/components/heart-rate-zones-settings";
import { MobileSettingsBackLink } from "@/features/settings/components/settings-layout";
import { TrainingNoteTagsSettings } from "@/features/settings/components/training-note-tags-settings";

export const Route = createFileRoute("/_authenticated/settings/training")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="space-y-6 md:space-y-10">
      <MobileSettingsBackLink />
      <EquipmentSettings />
      <HeartRateZonesSettings />
      <TrainingNoteTagsSettings />
    </div>
  );
}
