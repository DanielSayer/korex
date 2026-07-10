import { Button } from "@korex/ui/components/button";
import { Input } from "@korex/ui/components/input";
import { Label } from "@korex/ui/components/label";
import { Separator } from "@korex/ui/components/separator";
import { cn } from "@korex/ui/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { ArrowRight, Clock3Icon } from "lucide-react";
import { motion } from "motion/react";
import type { ComponentType, SVGProps } from "react";
import { useState } from "react";
import { toast } from "sonner";
import { orpc } from "@/utils/orpc";

type Provider = {
  id: "intervals" | "to-do";
  name: string;
  enabled: boolean;
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
  logoSrc?: string;
};

const providers: Provider[] = [
  {
    id: "intervals",
    name: "Intervals",
    logoSrc: "/logos/intervals-icu-logo.svg",
    enabled: true,
  },
  {
    id: "to-do",
    name: "Coming soon",
    icon: Clock3Icon,
    enabled: false,
  },
] as const;

type ProviderId = Provider["id"];

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
  const connectIntervalsIcuMutation = useMutation(
    orpc.providerConnections.connectIntervalsIcu.mutationOptions({
      onError: (error) => {
        toast.error(error.message);
      },
      onSuccess: () => {
        toast.success("API key connected");
        onConnected();
      },
    }),
  );

  const completeConnection = () => {
    if (!apiKey.trim()) {
      toast.error("Enter an API key to continue");
      return;
    }

    connectIntervalsIcuMutation.mutate({
      apiKey: apiKey.trim(),
    });
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
        <p className="hidden font-display text-[11px] text-muted-foreground uppercase tracking-[0.18em] lg:block">
          Provider connection
        </p>
        <h1 className="font-bold text-3xl tracking-tight lg:mt-2 lg:font-display lg:font-normal lg:text-4xl lg:lowercase lg:leading-none">
          Connect your API key
        </h1>
        <p className="text-muted-foreground text-sm">
          Select a provider and add your key.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
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
            className="group flex-1"
            onClick={completeConnection}
            loading={connectIntervalsIcuMutation.isPending}
            loadingText="Connecting"
          >
            Connect key
            <ArrowRight className="size-4 transition-all duration-200 group-hover:translate-x-1" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="flex-1"
            onClick={onSkip}
            disabled={connectIntervalsIcuMutation.isPending}
          >
            I&apos;ll do this later
          </Button>
        </div>

        <Separator className="my-4" />

        <div className="grid grid-cols-2 gap-2">
          {providers.map((provider) => {
            const isSelected = provider.id === selectedProvider;

            return (
              <button
                key={provider.id}
                type="button"
                disabled={!provider.enabled}
                aria-pressed={provider.enabled ? isSelected : undefined}
                onClick={() => setSelectedProvider(provider.id)}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-lg border bg-muted/20 p-2 text-center text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                  isSelected
                    ? "border-primary shadow-md shadow-primary/10 ring-2 ring-primary/15"
                    : "border-border hover:border-foreground/30",
                  !provider.enabled &&
                    "cursor-not-allowed opacity-55 hover:border-border",
                )}
              >
                <span className="flex size-9 items-center justify-center rounded-md bg-muted text-muted-foreground">
                  <ProviderLogo provider={provider} />
                </span>
                <span className="font-medium leading-tight">
                  {provider.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

function ProviderLogo({ provider }: { provider: Provider }) {
  if (provider.logoSrc) {
    return (
      <img
        src={provider.logoSrc}
        alt={`${provider.name} logo`}
        className="size-5 object-contain"
        aria-hidden="true"
      />
    );
  }

  const Icon = provider.icon;

  return Icon ? <Icon className="size-4" /> : null;
}

export { SignUpConnectStep };
