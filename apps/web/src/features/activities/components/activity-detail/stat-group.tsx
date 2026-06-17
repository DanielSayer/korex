import type { ReactNode } from "react";
import { MetricValue } from "./metric-value";

type StatGroupItem = {
  icon?: ReactNode;
  label: string;
  unit?: string;
  value: string;
};

function StatGroup({ items }: { items: StatGroupItem[] }) {
  return (
    <div className="grid grid-cols-3 divide-x divide-border">
      {items.map((item) => (
        <div
          key={item.label}
          className="min-w-0 px-2 py-2 first:pl-0 last:pr-0 md:px-5 md:py-4"
        >
          <p className="mb-1 font-medium text-muted-foreground text-xs uppercase">
            {item.label}
          </p>
          <MetricValue
            unit={item.unit}
            value={item.value}
            valueClassName="font-bold text-lg leading-none md:text-2xl"
          />
        </div>
      ))}
    </div>
  );
}

export { StatGroup };
