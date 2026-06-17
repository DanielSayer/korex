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
        "flex min-w-0 items-start gap-2",
        variant === "banner" &&
          "rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-destructive",
        className,
      )}
    >
      <TriangleAlertIcon className="mt-0.5 size-4 shrink-0 text-destructive" />
      <span className="wrap-break-word min-w-0 text-sm">{message}</span>
    </p>
  );
}

export { ErrorMessage };
