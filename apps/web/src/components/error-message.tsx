import { TriangleAlertIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type ErrorMessageProps = {
  message: string | undefined;
  className?: string;
};

function ErrorMessage({ message, className }: ErrorMessageProps) {
  return (
    <p className={cn("flex items-center gap-2", className)}>
      <TriangleAlertIcon className="size-4 shrink-0 text-destructive" />
      <span className="text-sm">{message}</span>
    </p>
  );
}

export { ErrorMessage };
