import { CheckCircleIcon, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type ModeCardProps = {
  icon: LucideIcon;
  isSelected: boolean;
  label: string;
  onClick: () => void;
};

function ModeCard({ icon: Icon, isSelected, label, onClick }: ModeCardProps) {
  return (
    <button
      aria-pressed={isSelected}
      className={cn(
        "w-full cursor-pointer rounded-lg border border-transparent bg-muted/20 p-4 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        isSelected
          ? "border-border bg-accent text-accent-foreground"
          : "hover:border-border",
      )}
      onClick={onClick}
      type="button"
    >
      <div className="flex items-center gap-3">
        <div className="flex size-8 items-center justify-center rounded-full bg-background">
          <Icon className="size-4 text-foreground" />
        </div>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="font-medium text-foreground">{label}</span>
          {isSelected ? (
            <CheckCircleIcon className="ml-auto size-4 text-journal-route" />
          ) : null}
        </div>
      </div>
    </button>
  );
}

export { ModeCard };
