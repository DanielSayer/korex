import type { BestEffortStandardDistanceCode } from "@korex/api/modules/activities/activities.types";
import { Button } from "@korex/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@korex/ui/components/dropdown-menu";
import { ChevronDownIcon } from "lucide-react";
import {
  bestEffortDistanceCodes,
  bestEffortDistanceLabels,
} from "./best-effort-distance-options";

function BestEffortDistancePicker({
  availableDistanceCodes,
  onDistanceCodeChange,
  selectedDistanceCode,
}: {
  availableDistanceCodes: BestEffortStandardDistanceCode[];
  onDistanceCodeChange: (distanceCode: BestEffortStandardDistanceCode) => void;
  selectedDistanceCode: BestEffortStandardDistanceCode;
}) {
  const availableDistanceCodeSet = new Set(availableDistanceCodes);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button size="sm" variant="outline" />}>
        {bestEffortDistanceLabels[selectedDistanceCode]}
        <ChevronDownIcon className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-44">
        <DropdownMenuRadioGroup
          onValueChange={(value) =>
            onDistanceCodeChange(value as BestEffortStandardDistanceCode)
          }
          value={selectedDistanceCode}
        >
          {bestEffortDistanceCodes.map((distanceCode) => {
            const isAvailable = availableDistanceCodeSet.has(distanceCode);

            return (
              <DropdownMenuRadioItem
                disabled={!isAvailable}
                key={distanceCode}
                value={distanceCode}
              >
                <span className="flex min-w-0 flex-col">
                  <span>{bestEffortDistanceLabels[distanceCode]}</span>
                  {!isAvailable && (
                    <span className="text-muted-foreground text-xs">
                      No effort
                    </span>
                  )}
                </span>
              </DropdownMenuRadioItem>
            );
          })}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { BestEffortDistancePicker };
