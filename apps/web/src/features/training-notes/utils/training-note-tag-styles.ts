import type { TrainingNoteTagColor } from "@korex/api/modules/training-notes/training-notes.types";

const trainingNoteTagColors: TrainingNoteTagColor[] = [
  "slate",
  "red",
  "orange",
  "amber",
  "green",
  "teal",
  "sky",
  "blue",
  "violet",
  "pink",
];

const trainingNoteTagClassNames: Record<TrainingNoteTagColor, string> = {
  amber: "border-chart-3/50 bg-chart-3/15 text-foreground",
  blue: "border-primary/50 bg-primary/10 text-foreground",
  green: "border-chart-4/50 bg-chart-4/15 text-foreground",
  orange: "border-chart-2/50 bg-chart-2/15 text-foreground",
  pink: "border-chart-1/30 bg-chart-1/10 text-foreground",
  red: "border-chart-1/50 bg-chart-1/15 text-foreground",
  sky: "border-chart-3/30 bg-chart-3/10 text-foreground",
  slate: "border-border bg-muted text-foreground",
  teal: "border-chart-5/50 bg-chart-5/15 text-foreground",
  violet: "border-chart-5/30 bg-chart-5/10 text-foreground",
};

const trainingNoteTagSwatchClassNames: Record<TrainingNoteTagColor, string> = {
  amber: "bg-chart-3",
  blue: "bg-primary",
  green: "bg-chart-4",
  orange: "bg-chart-2",
  pink: "bg-chart-1/70",
  red: "bg-chart-1",
  sky: "bg-chart-3/70",
  slate: "bg-muted-foreground",
  teal: "bg-chart-5",
  violet: "bg-chart-5/70",
};

function getTrainingNoteTagClassName(color: TrainingNoteTagColor) {
  return trainingNoteTagClassNames[color];
}

function getTrainingNoteTagSwatchClassName(color: TrainingNoteTagColor) {
  return trainingNoteTagSwatchClassNames[color];
}

function nextTrainingNoteTagColor(offset: number): TrainingNoteTagColor {
  return trainingNoteTagColors[offset % trainingNoteTagColors.length];
}

export {
  getTrainingNoteTagClassName,
  getTrainingNoteTagSwatchClassName,
  nextTrainingNoteTagColor,
  trainingNoteTagColors,
};
