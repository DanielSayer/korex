import { cn } from "@korex/ui/lib/utils";
import { Check } from "lucide-react";
import { motion } from "motion/react";

const steps = [
  { label: "Account", description: "Create your login" },
  { label: "Connect", description: "Add a provider" },
  { label: "Sync", description: "Import data" },
] as const;

function SignUpStepper({
  currentStep,
  syncProgress,
}: {
  currentStep: number;
  syncProgress?: number;
}) {
  const progress =
    syncProgress === undefined
      ? ((currentStep + 1) / steps.length) * 100
      : ((currentStep + syncProgress / 100) / steps.length) * 100;

  return (
    <div className="space-y-3">
      <div className="h-1 overflow-hidden rounded-full bg-muted">
        <motion.div
          className="h-full rounded-full bg-primary"
          initial={false}
          animate={{ width: `${progress}%` }}
        />
      </div>
      <div className="grid grid-cols-3 gap-2">
        {steps.map((step, index) => {
          const isComplete = index < currentStep;
          const isCurrent = index === currentStep;

          return (
            <div
              key={step.label}
              className={cn(
                "rounded-md border border-transparent bg-muted/20 px-3 py-2 text-xs",
                isCurrent && "border-border bg-muted/40",
              )}
            >
              <div className="flex items-center gap-2 font-medium">
                <span
                  className={cn(
                    "flex size-5 items-center justify-center rounded-full bg-muted text-[11px] text-muted-foreground",
                    {
                      "bg-primary text-primary-foreground":
                        isCurrent || isComplete,
                    },
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
