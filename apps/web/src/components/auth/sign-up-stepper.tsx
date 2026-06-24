import { cn } from "@korex/ui/lib/utils";
import { Check } from "lucide-react";
import { RouteProgress } from "@/components/brand";

const steps = [
  { label: "Account", description: "Create your login" },
  { label: "Connect", description: "Add a provider" },
  { label: "Sync", description: "Import data" },
] as const;

function SignUpStepper({ currentStep }: { currentStep: number }) {
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="flex flex-col gap-3">
      <RouteProgress value={progress} />
      <div className="grid grid-cols-3 gap-2">
        {steps.map((step, index) => {
          const isComplete = index < currentStep;
          const isCurrent = index === currentStep;

          return (
            <div
              key={step.label}
              className={cn(
                "border-border/40 border-b px-1 py-2 text-xs",
                isCurrent && "border-primary",
              )}
            >
              <div className="flex items-center gap-2 font-display lowercase tracking-tight">
                <span
                  className={cn(
                    "flex size-5 items-center justify-center rounded-full text-[11px]",
                    isCurrent || isComplete
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {isComplete ? <Check className="size-3" /> : index + 1}
                </span>
                <span>{step.label}</span>
              </div>
              <p className="mt-1 hidden text-muted-foreground sm:block">
                {step.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { SignUpStepper };
