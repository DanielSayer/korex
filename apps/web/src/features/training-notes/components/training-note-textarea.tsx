import { useEffect, useRef } from "react";

function TrainingNoteTextarea({
  focusOnMount = false,
  onChange,
  placeholder,
  value,
}: {
  focusOnMount?: boolean;
  onChange: (value: string) => void;
  placeholder?: string;
  value: string;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (focusOnMount) {
      textareaRef.current?.focus();
    }
  }, [focusOnMount]);

  return (
    <textarea
      aria-label="Training Note text"
      className="min-h-20 w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 md:rounded-none md:border-x-0 md:border-t-0 md:bg-transparent md:px-0 md:shadow-none"
      maxLength={2000}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      ref={textareaRef}
      value={value}
    />
  );
}

export { TrainingNoteTextarea };
