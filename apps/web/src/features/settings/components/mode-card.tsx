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
        "flex w-full cursor-pointer flex-col gap-6 overflow-hidden rounded-xl border border-transparent bg-muted/20 p-4 text-left text-card-foreground text-sm shadow-black/5 shadow-md backdrop-blur transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 md:rounded-lg md:shadow-none md:backdrop-blur-none",
        isSelected
          ? "bg-primary/5 ring-1 ring-primary/20 md:border-border md:bg-accent md:text-accent-foreground md:ring-0"
          : "hover:ring-1 hover:ring-border md:hover:border-border md:hover:ring-0",
      )}
      onClick={onClick}
      type="button"
    >
      <div className="flex items-center gap-3">
        <div className="flex size-8 items-center justify-center rounded-full bg-background">
          <Icon className="size-4 text-foreground" />
        </div>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="font-medium text-foreground md:text-inherit">
            {label}
          </span>
          {isSelected ? (
            <CheckCircleIcon className="ml-auto size-4 text-primary md:text-journal-route" />
          ) : null}
        </div>
      </div>
    </button>
  );
}

export { ModeCard };
