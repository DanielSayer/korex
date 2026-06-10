export type TrainingNoteTargetType = "activity" | "trainingWeek";

export type TrainingNote = {
  activityId: number | null;
  createdAt: Date;
  id: number;
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

export class TrainingNoteNotFoundError extends Error {
  constructor() {
    super("Training Note was not found.");
    this.name = "TrainingNoteNotFoundError";
  }
}
