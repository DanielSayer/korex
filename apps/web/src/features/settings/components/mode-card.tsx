import { Card } from "@korex/ui/components/card";
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
    <Card
      className={cn(
        "cursor-pointer border-0 bg-muted/20 p-4 transition-all duration-200 hover:bg-muted/40",
        isSelected
          ? "bg-primary/5 ring-1 ring-primary/20"
          : "hover:ring-1 hover:ring-border",
      )}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <div className="flex size-8 items-center justify-center rounded-full bg-background">
          <Icon className="size-4 text-foreground" />
        </div>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="font-medium text-foreground">{label}</span>
          {isSelected ? (
            <CheckCircleIcon className="ml-auto size-4 text-primary" />
          ) : null}
        </div>
      </div>
    </Card>
  );
}

export { ModeCard };
