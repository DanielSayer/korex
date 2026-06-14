import type {
  DefaultEquipment,
  Equipment,
} from "@korex/api/modules/equipment/equipment.types";
import { Button } from "@korex/ui/components/button";
import { Input } from "@korex/ui/components/input";
import { Label } from "@korex/ui/components/label";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArchiveIcon, RotateCcwIcon, SaveIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ErrorMessage } from "@/components/error-message";
import { QueryRenderer } from "@/components/query-renderer";
import { formatDistance } from "@/utils/formatters";
import { orpc } from "@/utils/orpc";

const runningSportTypes = ["run", "treadmill"] as const;

function EquipmentSettings() {
  const equipmentQueryOptions = orpc.equipment.list.queryOptions();
  const defaultsQueryOptions = orpc.equipment.defaults.queryOptions();
  const equipmentQuery = useQuery(equipmentQueryOptions);
  const defaultsQuery = useQuery(defaultsQueryOptions);

  return (
    <section className="border-border/70 border-b pb-10">
      <div className="grid gap-6 xl:grid-cols-[18rem_minmax(0,1fr)]">
        <div>
          <h2 className="font-semibold text-xl tracking-tight">Equipment</h2>
          <p className="mt-2 text-muted-foreground text-sm leading-6">
            Track shoes from Korex assignments and apply defaults to newly
            imported runs.
          </p>
        </div>

        <QueryRenderer
          error={
            <ErrorMessage
              message="Could not load Equipment."
              variant="banner"
            />
          }
          loading={<EquipmentSettingsSkeleton />}
          query={equipmentQuery}
        >
          {(equipment) => (
            <QueryRenderer
              error={
                <ErrorMessage
                  message="Could not load Default Equipment."
                  variant="banner"
                />
              }
              loading={<EquipmentSettingsSkeleton />}
              query={defaultsQuery}
            >
              {(defaults) => (
                <EquipmentSettingsContent
                  defaults={defaults}
                  equipment={equipment}
                />
              )}
            </QueryRenderer>
          )}
        </QueryRenderer>
      </div>
    </section>
  );
}

function EquipmentSettingsContent({
  defaults,
  equipment,
}: {
  defaults: DefaultEquipment[];
  equipment: Equipment[];
}) {
  return (
    <div className="min-w-0 space-y-8">
      <CreateEquipmentForm />
      <DefaultEquipmentSettings defaults={defaults} equipment={equipment} />
      <EquipmentList equipment={equipment} />
    </div>
  );
}

function CreateEquipmentForm() {
  const queryClient = useQueryClient();
  const equipmentQueryOptions = orpc.equipment.list.queryOptions();
  const [name, setName] = useState("");
  const [startingDistanceKm, setStartingDistanceKm] = useState("");
  const [retirementDistanceKm, setRetirementDistanceKm] = useState("700");
  const createMutation = useMutation(
    orpc.equipment.create.mutationOptions({
      onError: (error) => toast.error(error.message),
      onSuccess: async () => {
        toast.success("Equipment created");
        setName("");
        setStartingDistanceKm("");
        await queryClient.invalidateQueries({
          queryKey: equipmentQueryOptions.queryKey,
        });
      },
    }),
  );

  return (
    <form
      className="space-y-4 border-border/70 border-b pb-6"
      onSubmit={(event) => {
        event.preventDefault();
        createMutation.mutate({
          equipmentType: "shoes",
          name,
          retirementDistanceMeters: toMetersOrNull(retirementDistanceKm),
          startingDistanceMeters: toMetersOrZero(startingDistanceKm),
        });
      }}
    >
      <div>
        <h3 className="font-semibold text-base">Add Shoes</h3>
        <p className="text-muted-foreground text-sm">
          Starting distance covers usage before Korex assignments begin.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-[minmax(12rem,1fr)_9rem_9rem_auto] md:items-end">
        <div className="space-y-2">
          <Label htmlFor="equipment-name">Name</Label>
          <Input
            id="equipment-name"
            onChange={(event) => setName(event.target.value)}
            required
            value={name}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="equipment-starting-distance">Starting km</Label>
          <Input
            id="equipment-starting-distance"
            inputMode="decimal"
            onChange={(event) => setStartingDistanceKm(event.target.value)}
            value={startingDistanceKm}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="equipment-retirement-distance">Retire at km</Label>
          <Input
            id="equipment-retirement-distance"
            inputMode="decimal"
            onChange={(event) => setRetirementDistanceKm(event.target.value)}
            value={retirementDistanceKm}
          />
        </div>
        <Button disabled={createMutation.isPending} type="submit">
          <SaveIcon className="size-4" />
          Add
        </Button>
      </div>
    </form>
  );
}

function DefaultEquipmentSettings({
  defaults,
  equipment,
}: {
  defaults: DefaultEquipment[];
  equipment: Equipment[];
}) {
  const activeShoes = equipment.filter((item) => item.retiredAt === null);

  return (
    <div className="space-y-4 border-border/70 border-b pb-6">
      <div>
        <h3 className="font-semibold text-base">Default Shoes</h3>
        <p className="text-muted-foreground text-sm">
          Defaults apply to newly imported Activities and never overwrite manual
          assignments.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {runningSportTypes.map((sportType) => (
          <DefaultEquipmentSelect
            defaults={defaults}
            equipment={activeShoes}
            key={sportType}
            sportType={sportType}
          />
        ))}
      </div>
    </div>
  );
}

function DefaultEquipmentSelect({
  defaults,
  equipment,
  sportType,
}: {
  defaults: DefaultEquipment[];
  equipment: Equipment[];
  sportType: "run" | "treadmill";
}) {
  const queryClient = useQueryClient();
  const defaultsQueryOptions = orpc.equipment.defaults.queryOptions();
  const defaultEquipment = defaults.find(
    (item) => item.sportType === sportType && item.equipmentType === "shoes",
  );
  const setDefaultMutation = useMutation(
    orpc.equipment.setDefault.mutationOptions({
      onError: (error) => toast.error(error.message),
      onSuccess: async () => {
        toast.success("Default Equipment saved");
        await queryClient.invalidateQueries({
          queryKey: defaultsQueryOptions.queryKey,
        });
      },
    }),
  );
  const clearDefaultMutation = useMutation(
    orpc.equipment.clearDefault.mutationOptions({
      onError: (error) => toast.error(error.message),
      onSuccess: async () => {
        toast.success("Default Equipment cleared");
        await queryClient.invalidateQueries({
          queryKey: defaultsQueryOptions.queryKey,
        });
      },
    }),
  );

  return (
    <div className="space-y-2">
      <Label htmlFor={`default-equipment-${sportType}`}>
        {sportType === "run" ? "Run" : "Treadmill"}
      </Label>
      <select
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
        id={`default-equipment-${sportType}`}
        onChange={(event) => {
          const equipmentId = Number(event.target.value);

          if (equipmentId) {
            setDefaultMutation.mutate({ equipmentId, sportType });
            return;
          }

          clearDefaultMutation.mutate({
            equipmentType: "shoes",
            sportType,
          });
        }}
        value={defaultEquipment?.equipmentId ?? ""}
      >
        <option value="">None</option>
        {equipment.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
          </option>
        ))}
      </select>
    </div>
  );
}

function EquipmentList({ equipment }: { equipment: Equipment[] }) {
  if (equipment.length === 0) {
    return (
      <div className="border-border/70 border-y py-6 text-center text-muted-foreground text-sm">
        No Equipment yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <h3 className="font-semibold text-base">Shoes</h3>
        <p className="text-muted-foreground text-sm">
          Usage combines starting distance and assigned Activity distance.
        </p>
      </div>
      <div className="divide-y border-border/70 border-y">
        {equipment.map((item) => (
          <EquipmentRow item={item} key={item.id} />
        ))}
      </div>
    </div>
  );
}

function EquipmentRow({ item }: { item: Equipment }) {
  const queryClient = useQueryClient();
  const equipmentQueryOptions = orpc.equipment.list.queryOptions();
  const defaultsQueryOptions = orpc.equipment.defaults.queryOptions();
  const retirementPercent = useMemo(() => {
    if (!item.retirementDistanceMeters || item.retirementDistanceMeters <= 0) {
      return null;
    }

    return Math.min(
      (item.usageDistanceMeters / item.retirementDistanceMeters) * 100,
      100,
    );
  }, [item.retirementDistanceMeters, item.usageDistanceMeters]);
  const retireMutation = useMutation(
    orpc.equipment.retire.mutationOptions({
      onError: (error) => toast.error(error.message),
      onSuccess: async () => {
        toast.success("Equipment retired");
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: equipmentQueryOptions.queryKey,
          }),
          queryClient.invalidateQueries({
            queryKey: defaultsQueryOptions.queryKey,
          }),
        ]);
      },
    }),
  );
  const restoreMutation = useMutation(
    orpc.equipment.restore.mutationOptions({
      onError: (error) => toast.error(error.message),
      onSuccess: async () => {
        toast.success("Equipment restored");
        await queryClient.invalidateQueries({
          queryKey: equipmentQueryOptions.queryKey,
        });
      },
    }),
  );

  return (
    <div className="grid gap-4 py-4 md:grid-cols-[minmax(12rem,1fr)_9rem_9rem_auto] md:items-center">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h4 className="font-medium">{item.name}</h4>
          {item.retiredAt ? (
            <span className="rounded border border-border px-2 py-0.5 text-muted-foreground text-xs">
              Retired
            </span>
          ) : null}
        </div>
        <p className="text-muted-foreground text-sm">
          {item.activityCount} assigned Activities
        </p>
        {retirementPercent !== null ? (
          <div className="mt-3 h-2 overflow-hidden rounded bg-muted">
            <div
              className="h-full bg-primary"
              style={{ width: `${retirementPercent}%` }}
            />
          </div>
        ) : null}
      </div>
      <Metric label="Usage" value={formatDistance(item.usageDistanceMeters)} />
      <Metric
        label="Retire at"
        value={formatDistance(item.retirementDistanceMeters)}
      />
      {item.retiredAt ? (
        <Button
          disabled={restoreMutation.isPending}
          onClick={() => restoreMutation.mutate({ id: item.id })}
          type="button"
          variant="outline"
        >
          <RotateCcwIcon className="size-4" />
          Restore
        </Button>
      ) : (
        <Button
          disabled={retireMutation.isPending}
          onClick={() => retireMutation.mutate({ id: item.id })}
          type="button"
          variant="outline"
        >
          <ArchiveIcon className="size-4" />
          Retire
        </Button>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-muted-foreground text-xs">{label}</div>
      <div className="font-medium text-sm">{value}</div>
    </div>
  );
}

function EquipmentSettingsSkeleton() {
  return (
    <div className="space-y-4">
      {[0, 1, 2].map((key) => (
        <div className="h-24 animate-pulse bg-muted" key={key} />
      ))}
    </div>
  );
}

function toMetersOrZero(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return 0;
  }

  return Number(trimmed) * 1000;
}

function toMetersOrNull(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  return Number(trimmed) * 1000;
}

export { EquipmentSettings };
