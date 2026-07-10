import type { HeartRateZone } from "@korex/api/modules/heart-rate-zones/heart-rate-zones.types";
import { Button } from "@korex/ui/components/button";
import { Input } from "@korex/ui/components/input";
import { Label } from "@korex/ui/components/label";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  PlusIcon,
  SaveIcon,
  Trash2Icon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ErrorMessage } from "@/components/error-message";
import { QueryRenderer } from "@/components/query-renderer";
import { orpc } from "@/utils/orpc";

type HeartRateZoneDraft = {
  id: number | null;
  key: string;
  maxBpm: string;
  minBpm: string;
  name: string;
};

function HeartRateZonesSettings() {
  const zonesQueryOptions = orpc.heartRateZones.list.queryOptions();
  const zonesQuery = useQuery(zonesQueryOptions);

  return (
    <QueryRenderer
      error={
        <ErrorMessage
          message="Could not load Heart Rate Zones."
          variant="banner"
        />
      }
      loading={<HeartRateZonesSettingsSkeleton />}
      query={zonesQuery}
    >
      {(zones) => <HeartRateZonesEditor zones={zones} />}
    </QueryRenderer>
  );
}

function HeartRateZonesEditor({ zones }: { zones: HeartRateZone[] }) {
  const queryClient = useQueryClient();
  const zonesQueryOptions = orpc.heartRateZones.list.queryOptions();
  const [drafts, setDrafts] = useState(() => toDrafts(zones));

  useEffect(() => {
    setDrafts(toDrafts(zones));
  }, [zones]);

  const validation = useMemo(() => validateDrafts(drafts), [drafts]);
  const hasChanges = JSON.stringify(toDrafts(zones)) !== JSON.stringify(drafts);
  const replaceMutation = useMutation(
    orpc.heartRateZones.replace.mutationOptions({
      onError: (error) => {
        toast.error(error.message);
      },
      onSuccess: (savedZones) => {
        toast.success("Heart Rate Zones saved");
        queryClient.setQueryData(zonesQueryOptions.queryKey, savedZones);
        setDrafts(toDrafts(savedZones));
      },
    }),
  );

  return (
    <section
      className="scroll-mt-6 border-border/70 border-b pb-10"
      id="training"
    >
      <div className="grid gap-6 xl:grid-cols-[18rem_minmax(0,1fr)]">
        <div className="md:border-border/30 md:border-l md:pl-4">
          <h2 className="font-semibold text-xl tracking-tight md:font-display md:font-normal md:text-[11px] md:text-muted-foreground md:uppercase md:tracking-[0.18em]">
            Training
          </h2>
          <p className="mt-2 text-muted-foreground text-sm leading-6">
            Manage active heart rate zone names and BPM ranges used in activity
            analysis.
          </p>
        </div>

        <div className="min-w-0 space-y-5">
          <div className="flex flex-col gap-3 border-border/70 border-b pb-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="font-semibold text-base md:font-display md:text-lg md:tracking-tight">
                Heart Rate Zones
              </h3>
              <p className="text-muted-foreground text-sm">
                Ordered zones with non-overlapping minimum and maximum BPM.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                disabled={!hasChanges || replaceMutation.isPending}
                onClick={() => setDrafts(toDrafts(zones))}
                type="button"
                variant="outline"
              >
                Reset
              </Button>
              <Button
                disabled={
                  !hasChanges ||
                  validation.errors.length > 0 ||
                  replaceMutation.isPending
                }
                onClick={() =>
                  replaceMutation.mutate({
                    zones: drafts.map((draft, index) => ({
                      maxBpm: draft.maxBpm.trim() ? Number(draft.maxBpm) : null,
                      minBpm: Number(draft.minBpm),
                      name: draft.name.trim(),
                      position: index + 1,
                    })),
                  })
                }
                type="button"
              >
                <SaveIcon className="size-4" />
                Save zones
              </Button>
            </div>
          </div>

          {validation.errors.length > 0 ? (
            <ErrorMessage message={validation.errors[0]} variant="banner" />
          ) : null}

          {drafts.length === 0 ? (
            <div className="border-border/70 border-y py-6 text-center text-muted-foreground text-sm">
              No active Heart Rate Zones yet.
            </div>
          ) : (
            <div className="divide-y">
              {drafts.map((draft, index) => (
                <HeartRateZoneRow
                  draft={draft}
                  isFirst={index === 0}
                  isLast={index === drafts.length - 1}
                  key={draft.key}
                  onChange={(nextDraft) =>
                    setDrafts((current) =>
                      current.map((currentDraft) =>
                        currentDraft.key === draft.key
                          ? nextDraft
                          : currentDraft,
                      ),
                    )
                  }
                  onDelete={() =>
                    setDrafts((current) =>
                      current.filter(
                        (currentDraft) => currentDraft.key !== draft.key,
                      ),
                    )
                  }
                  onMoveDown={() =>
                    setDrafts((current) => moveDraft(current, index, index + 1))
                  }
                  onMoveUp={() =>
                    setDrafts((current) => moveDraft(current, index, index - 1))
                  }
                />
              ))}
            </div>
          )}

          <Button
            onClick={() =>
              setDrafts((current) => [
                ...current,
                {
                  id: null,
                  key: crypto.randomUUID(),
                  maxBpm: "",
                  minBpm: getNextMinBpm(current),
                  name: `Zone ${current.length + 1}`,
                },
              ])
            }
            type="button"
            variant="outline"
          >
            <PlusIcon className="size-4" />
            Add zone
          </Button>
        </div>
      </div>
    </section>
  );
}

function HeartRateZoneRow({
  draft,
  isFirst,
  isLast,
  onChange,
  onDelete,
  onMoveDown,
  onMoveUp,
}: {
  draft: HeartRateZoneDraft;
  isFirst: boolean;
  isLast: boolean;
  onChange: (draft: HeartRateZoneDraft) => void;
  onDelete: () => void;
  onMoveDown: () => void;
  onMoveUp: () => void;
}) {
  return (
    <div className="grid gap-4 py-4 first:pt-0 last:pb-0 lg:grid-cols-[minmax(12rem,1fr)_8rem_8rem_auto] lg:items-end">
      <div className="space-y-2">
        <Label htmlFor={`${draft.key}-name`}>Name</Label>
        <Input
          id={`${draft.key}-name`}
          onChange={(event) => onChange({ ...draft, name: event.target.value })}
          value={draft.name}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${draft.key}-min`}>Min BPM</Label>
        <Input
          id={`${draft.key}-min`}
          inputMode="numeric"
          onChange={(event) =>
            onChange({ ...draft, minBpm: event.target.value })
          }
          value={draft.minBpm}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${draft.key}-max`}>Max BPM</Label>
        <Input
          id={`${draft.key}-max`}
          inputMode="numeric"
          onChange={(event) =>
            onChange({ ...draft, maxBpm: event.target.value })
          }
          placeholder={isLast ? "Open" : undefined}
          value={draft.maxBpm}
        />
      </div>
      <div className="flex gap-2">
        <Button
          aria-label="Move zone up"
          disabled={isFirst}
          onClick={onMoveUp}
          size="icon"
          type="button"
          variant="outline"
        >
          <ArrowUpIcon className="size-4" />
        </Button>
        <Button
          aria-label="Move zone down"
          disabled={isLast}
          onClick={onMoveDown}
          size="icon"
          type="button"
          variant="outline"
        >
          <ArrowDownIcon className="size-4" />
        </Button>
        <Button
          aria-label="Delete zone"
          onClick={onDelete}
          size="icon"
          type="button"
          variant="outline"
        >
          <Trash2Icon className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function HeartRateZonesSettingsSkeleton() {
  return (
    <section className="border-border/70 border-b pb-10">
      <div className="grid gap-6 xl:grid-cols-[18rem_minmax(0,1fr)]">
        <div className="md:border-border/30 md:border-l md:pl-4">
          <div className="h-7 w-28 animate-pulse bg-muted" />
          <div className="mt-3 h-16 w-full animate-pulse bg-muted" />
        </div>
        <div className="space-y-3">
          {[0, 1, 2, 3, 4].map((key) => (
            <div className="h-20 animate-pulse bg-muted" key={key} />
          ))}
        </div>
      </div>
    </section>
  );
}

function toDrafts(zones: HeartRateZone[]): HeartRateZoneDraft[] {
  return zones.map((zone) => ({
    id: zone.id,
    key: String(zone.id),
    maxBpm: zone.maxBpm === null ? "" : String(zone.maxBpm),
    minBpm: String(zone.minBpm),
    name: zone.name,
  }));
}

function moveDraft(
  drafts: HeartRateZoneDraft[],
  fromIndex: number,
  toIndex: number,
) {
  const nextDrafts = [...drafts];
  const [draft] = nextDrafts.splice(fromIndex, 1);
  nextDrafts.splice(toIndex, 0, draft);
  return nextDrafts;
}

function getNextMinBpm(drafts: HeartRateZoneDraft[]) {
  const lastDraft = drafts.at(-1);

  if (!lastDraft?.maxBpm.trim()) {
    return "";
  }

  return lastDraft.maxBpm;
}

function validateDrafts(drafts: HeartRateZoneDraft[]) {
  const errors: string[] = [];
  const parsedDrafts = drafts.map((draft) => ({
    ...draft,
    maxBpm: draft.maxBpm.trim() ? Number(draft.maxBpm) : null,
    minBpm: Number(draft.minBpm),
  }));

  for (const draft of parsedDrafts) {
    if (!draft.name.trim()) {
      errors.push("Every Heart Rate Zone needs a name.");
    }

    if (!Number.isInteger(draft.minBpm) || draft.minBpm < 0) {
      errors.push("Every Heart Rate Zone needs a valid minimum BPM.");
    }

    if (
      draft.maxBpm !== null &&
      (!Number.isInteger(draft.maxBpm) || draft.maxBpm <= draft.minBpm)
    ) {
      errors.push("Every max BPM must be greater than its min BPM.");
    }
  }

  for (let index = 1; index < parsedDrafts.length; index += 1) {
    const previousDraft = parsedDrafts[index - 1];
    const draft = parsedDrafts[index];

    if (previousDraft.maxBpm === null) {
      errors.push("Only the final Heart Rate Zone can have an open max BPM.");
      continue;
    }

    if (draft.minBpm < previousDraft.maxBpm) {
      errors.push("Heart Rate Zones must not overlap.");
    }
  }

  return { errors };
}

export { HeartRateZonesSettings };
