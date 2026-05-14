import { TriangleAlertIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type ErrorMessageProps = {
  message: string | undefined;
  className?: string;
  variant?: "inline" | "banner";
};

function ErrorMessage({
  message,
  className,
  variant = "inline",
}: ErrorMessageProps) {
  return (
    <p
      className={cn(
        "flex items-center gap-2",
        variant === "banner" &&
          "rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-destructive",
        className,
      )}
    >
      <TriangleAlertIcon className="size-4 shrink-0 text-destructive" />
      <span className="text-sm">{message}</span>
    </p>
  );
}

export { ErrorMessage };
