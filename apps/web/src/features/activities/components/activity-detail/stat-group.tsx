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
        <div key={item.label} className="px-5 py-4 first:pl-0 last:pr-0">
          <p className="mb-1 font-medium text-muted-foreground text-xs uppercase">
            {item.label}
          </p>
          <MetricValue
            unit={item.unit}
            value={item.value}
            valueClassName="font-bold text-2xl leading-none"
          />
        </div>
      ))}
    </div>
  );
}

export { StatGroup };
