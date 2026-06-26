import type { TrainingNoteTagColor } from "@korex/api/modules/training-notes/training-notes.types";
import { getTrainingNoteTagClassName } from "@/features/training-notes/utils/training-note-tag-styles";
import { cn } from "@/lib/utils";

function TrainingNoteTagPreview({
  archived = false,
  color,
  name,
}: {
  archived?: boolean;
  color: TrainingNoteTagColor;
  name: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2 py-0.5 font-medium text-xs",
        getTrainingNoteTagClassName(color),
        archived && "border-dashed opacity-80",
      )}
    >
      {name}
    </span>
  );
}

export { TrainingNoteTagPreview };
