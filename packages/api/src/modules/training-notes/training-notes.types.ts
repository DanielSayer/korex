export type TrainingNoteTargetType = "activity" | "trainingWeek";

export const trainingNoteTagColors = [
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
] as const;

export type TrainingNoteTagColor = (typeof trainingNoteTagColors)[number];

export type TrainingNoteTag = {
  archivedAt: Date | null;
  color: TrainingNoteTagColor;
  createdAt: Date;
  id: number;
  name: string;
  updatedAt: Date;
  userId: string;
};

export type TrainingNote = {
  activityId: number | null;
  createdAt: Date;
  id: number;
  tags: TrainingNoteTag[];
  targetLabel: string | null;
  targetStartAt: Date | null;
  targetType: TrainingNoteTargetType;
  text: string;
  updatedAt: Date;
  userId: string;
  weekStartAt: Date | null;
};

export class TrainingNoteTargetError extends Error {
  constructor(message = "Training Note target is invalid.") {
    super(message);
    this.name = "TrainingNoteTargetError";
  }
}

export class TrainingNoteTextError extends Error {
  constructor(message = "Training Note text is invalid.") {
    super(message);
    this.name = "TrainingNoteTextError";
  }
}

export class TrainingNoteTagError extends Error {
  constructor(message = "Training Note Tag is invalid.") {
    super(message);
    this.name = "TrainingNoteTagError";
  }
}

export class TrainingNoteNotFoundError extends Error {
  constructor() {
    super("Training Note was not found.");
    this.name = "TrainingNoteNotFoundError";
  }
}
