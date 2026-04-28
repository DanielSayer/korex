import { Button } from "@korex/ui/components/button";
import { ArrowRight, Check, CircleDashed } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

function SignUpSyncStep({ onComplete }: { onComplete: () => void }) {
  const [isSyncing, setIsSyncing] = useState(false);

  const startSync = async () => {
    setIsSyncing(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSyncing(false);
    toast.success("Sync started");
    onComplete();
  };

  return (
    <motion.div
      key="sync"
      initial={{ opacity: 0, x: 28 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -28 }}
      className="flex flex-col gap-6"
    >
      <div>
        <h1 className="font-bold text-3xl tracking-tight">Ready to sync</h1>
        <p className="text-muted-foreground text-sm">
          Your Intervals key is connected. Start a mocked first sync and
          continue to the dashboard.
        </p>
      </div>

      <div className="grid w-full grid-cols-3 gap-2 rounded-xl border bg-muted/30 p-2">
        {["Validate key", "Queue import", "Prepare dashboard"].map(
          (item, index) => (
            <div
              key={item}
              className="flex flex-col items-center gap-2 rounded-lg bg-background px-2 py-3 text-sm"
            >
              {isSyncing && index === 1 ? (
                <CircleDashed className="size-4 animate-spin text-primary" />
              ) : (
                <Check className="size-4 text-primary" />
              )}
              <span className="leading-tight">{item}</span>
            </div>
          ),
        )}
      </div>

      <Button
        type="button"
        size="lg"
        className="w-full"
        onClick={startSync}
        disabled={isSyncing}
        loading={isSyncing}
        loadingText="Starting sync"
      >
        Start sync
        <ArrowRight className="size-4" />
      </Button>
    </motion.div>
  );
}

export { SignUpSyncStep };
