import { Button } from "@korex/ui/components/button";
import { useMutation } from "@tanstack/react-query";
import { ArrowRight, CloudSyncIcon } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { orpc } from "@/utils/orpc";

type SyncResult = {
  activitiesStored: number;
  status: string;
};

function SignUpSyncStep({ onGoToDashboard }: { onGoToDashboard: () => void }) {
  const initialSyncMutation = useMutation(
    orpc.syncs.initial.mutationOptions({
      onError: (error) => {
        toast.error(error.message);
      },
      onSuccess: () => {
        toast.success("Sync complete");
      },
    }),
  );

  const startSync = async () => {
    initialSyncMutation.mutate(undefined);
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
        <p className="hidden font-display text-[11px] text-muted-foreground uppercase tracking-[0.18em] lg:block">
          Initial import
        </p>
        <h1 className="font-bold text-3xl tracking-tight lg:mt-2 lg:font-display lg:font-normal lg:text-4xl lg:lowercase lg:leading-none">
          Ready to sync
        </h1>
        <p className="text-muted-foreground text-sm">
          Your Intervals key is connected.
        </p>
      </div>

      {initialSyncMutation.data ? (
        <SignUpSyncSummary result={initialSyncMutation.data} />
      ) : initialSyncMutation.isPending ? (
        <SignUpSyncLoader />
      ) : (
        <div className="my-4 flex flex-col items-center gap-2 text-center">
          <div className="relative flex size-28 items-center justify-center">
            <div className="relative flex size-20 items-center justify-center rounded-2xl border bg-muted/30 shadow-sm">
              <CloudSyncIcon className="size-9 text-muted-foreground" />
            </div>
          </div>
          <p>Sync this year&apos;s data to your dashboard.</p>
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        {initialSyncMutation.data ? (
          <Button
            type="button"
            size="lg"
            onClick={onGoToDashboard}
            className="group w-full"
          >
            Go to dashboard
            <ArrowRight className="size-4 transition-all duration-200 group-hover:translate-x-1" />
          </Button>
        ) : (
          <>
            <Button
              type="button"
              size="lg"
              onClick={startSync}
              loading={initialSyncMutation.isPending}
              loadingText="Starting sync"
              className="group flex-1"
            >
              Start sync
              <ArrowRight className="size-4 transition-all duration-200 group-hover:translate-x-1" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="flex-1"
              disabled={initialSyncMutation.isPending}
              onClick={onGoToDashboard}
            >
              I&apos;ll do this later
            </Button>
          </>
        )}
      </div>
    </motion.div>
  );
}

function SignUpSyncSummary({ result }: { result: SyncResult }) {
  return (
    <div className="my-4 flex flex-col items-center gap-3 text-center">
      <div className="flex size-20 items-center justify-center rounded-2xl border bg-muted/30 shadow-sm">
        <CloudSyncIcon className="size-9 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <p className="font-medium">
          {result.activitiesStored} activities synced
        </p>
        <p className="text-muted-foreground text-sm">
          Status: {getSyncStatusLabel(result.status)}
        </p>
      </div>
    </div>
  );
}

function getSyncStatusLabel(status: string) {
  switch (status) {
    case "failed":
      return "Partial";
    case "partial":
      return "Partially correct";
    case "success":
      return "Completed";
    default:
      return status;
  }
}

function SignUpSyncLoader() {
  return (
    <div className="my-4 flex flex-col items-center gap-2 text-center">
      <div className="relative flex size-28 items-center justify-center">
        <motion.span
          className="absolute inset-0 rounded-full border border-primary/20"
          animate={{ scale: [1, 1.2, 1], opacity: [0.6, 0, 0.6] }}
          transition={{
            duration: 1.8,
            ease: "easeInOut",
            repeat: Number.POSITIVE_INFINITY,
          }}
        />
        <motion.span
          className="absolute inset-3 rounded-full border border-primary/15"
          animate={{ rotate: 360 }}
          transition={{
            duration: 3.2,
            ease: "linear",
            repeat: Number.POSITIVE_INFINITY,
          }}
        />
        <motion.div
          className="relative flex size-20 items-center justify-center rounded-2xl border bg-muted/30 shadow-sm"
          animate={{
            y: [0, -4, 0],
            borderColor: "hsl(var(--primary) / 0.35)",
          }}
          transition={{
            duration: 1.6,
            ease: "easeInOut",
            repeat: Number.POSITIVE_INFINITY,
          }}
        >
          <CloudSyncIcon className="size-9 text-muted-foreground" />
        </motion.div>
      </div>
      <div className="space-y-1">
        <p>Syncing your data to the dashboard.</p>
        <p className="text-muted-foreground text-sm">
          This can take a moment. Keep this tab open while we prepare your
          workspace.
        </p>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
        <motion.div
          animate={{ x: ["-100%", "250%"] }}
          className="h-full w-1/3 rounded-full bg-primary"
          transition={{
            duration: 1.4,
            ease: "easeInOut",
            repeat: Number.POSITIVE_INFINITY,
          }}
        />
      </div>
    </div>
  );
}

export { SignUpSyncStep };
