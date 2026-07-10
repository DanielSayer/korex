function TrainingNotesLoading() {
  return (
    <div
      aria-label="Loading Training Notes"
      className="space-y-3"
      role="status"
    >
      <div className="h-16 animate-pulse rounded-md bg-muted md:rounded-none md:border-border/40 md:border-b md:bg-transparent">
        <span className="sr-only">Loading Training Notes</span>
      </div>
      <div className="h-16 animate-pulse rounded-md bg-muted md:rounded-none md:border-border/40 md:border-b md:bg-transparent" />
    </div>
  );
}

export { TrainingNotesLoading };
