import { Button } from "@korex/ui/components/button";
import { Input } from "@korex/ui/components/input";
import { Label } from "@korex/ui/components/label";
import { cn } from "@korex/ui/lib/utils";
import {
  ArrowRight,
  Clock3,
  PlugZap,
  RadioTower,
  Waypoints,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

const providers = [
  {
    id: "intervals",
    name: "Intervals",
    description: "Connect time, task, and project data.",
    icon: Clock3,
    enabled: true,
  },
  {
    id: "linear",
    name: "Provider",
    description: "Coming soon",
    icon: Waypoints,
    enabled: false,
  },
  {
    id: "warehouse",
    name: "Provider",
    description: "Coming soon",
    icon: RadioTower,
    enabled: false,
  },
] as const;

type ProviderId = (typeof providers)[number]["id"];

function SignUpConnectStep({
  onConnected,
  onSkip,
}: {
  onConnected: () => void;
  onSkip: () => void;
}) {
  const [selectedProvider, setSelectedProvider] =
    useState<ProviderId>("intervals");
  const [apiKey, setApiKey] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const selectedProviderDetails = providers.find(
    (provider) => provider.id === selectedProvider,
  );

  const completeConnection = async () => {
    if (!apiKey.trim()) {
      toast.error("Enter an API key to continue");
      return;
    }

    setIsConnecting(true);
    await new Promise((resolve) => setTimeout(resolve, 650));
    setIsConnecting(false);
    toast.success("API key connected");
    onConnected();
  };

  return (
    <motion.div
      key="connect"
      initial={{ opacity: 0, x: 28 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -28 }}
      className="flex flex-col gap-6"
    >
      <div>
        <h1 className="font-bold text-3xl tracking-tight">
          Connect your API key
        </h1>
        <p className="text-muted-foreground text-sm">
          Select a provider and add your key.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="rounded-lg border bg-muted/20 p-4">
          <div className="mb-4 flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              {selectedProviderDetails ? (
                <selectedProviderDetails.icon className="size-5" />
              ) : (
                <PlugZap className="size-5" />
              )}
            </div>
            <div>
              <h2 className="font-semibold">{selectedProviderDetails?.name}</h2>
              <p className="text-muted-foreground text-sm">
                Paste your API key to prepare the first sync.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="api-key">API key</Label>
            <Input
              id="api-key"
              type="password"
              value={apiKey}
              placeholder="int_live_..."
              onChange={(event) => setApiKey(event.target.value)}
            />
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              className="flex-1"
              onClick={completeConnection}
              disabled={isConnecting}
              loading={isConnecting}
              loadingText="Connecting"
            >
              Connect key
              <ArrowRight className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="flex-1"
              onClick={onSkip}
            >
              I&apos;ll do this later
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {providers.map((provider) => {
            const ProviderIcon = provider.icon;
            const isSelected = provider.id === selectedProvider;

            return (
              <button
                key={provider.id}
                type="button"
                disabled={!provider.enabled}
                onClick={() => setSelectedProvider(provider.id)}
                className={cn(
                  "flex min-h-24 flex-col items-center justify-center gap-2 rounded-lg border bg-muted/20 p-2 text-center text-sm transition-all",
                  isSelected
                    ? "border-primary shadow-md shadow-primary/10 ring-2 ring-primary/15"
                    : "border-border hover:border-foreground/30",
                  !provider.enabled &&
                    "cursor-not-allowed opacity-55 hover:border-border",
                )}
              >
                <span
                  className={cn(
                    "flex size-9 items-center justify-center rounded-md bg-muted text-muted-foreground",
                    isSelected && "bg-primary text-primary-foreground",
                  )}
                >
                  <ProviderIcon className="size-4" />
                </span>
                <span className="font-medium leading-tight">
                  {provider.name}
                </span>
                <span className="text-muted-foreground text-xs leading-tight">
                  {provider.description}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

export { SignUpConnectStep };
