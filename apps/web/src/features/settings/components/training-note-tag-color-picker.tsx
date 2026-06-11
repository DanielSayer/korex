import type { TrainingNoteTagColor } from "@korex/api/modules/training-notes/training-notes.types";
import { cn } from "@/lib/utils";
import {
  getTrainingNoteTagSwatchClassName,
  trainingNoteTagColors,
} from "./training-note-tags-styles";

function TrainingNoteTagColorPicker({
  color,
  onChange,
}: {
  color: TrainingNoteTagColor;
  onChange: (color: TrainingNoteTagColor) => void;
}) {
  return (
    <div className="grid grid-cols-5 gap-3">
      {trainingNoteTagColors.map((option) => (
        <button
          aria-label={`Use ${option} tag color`}
          className={cn(
            "size-11 rounded-full border transition-transform hover:scale-105",
            getTrainingNoteTagSwatchClassName(option),
            color === option && "ring-2 ring-ring ring-offset-2",
          )}
          key={option}
          onClick={() => onChange(option)}
          type="button"
        />
      ))}
    </div>
  );
}

export { TrainingNoteTagColorPicker };
