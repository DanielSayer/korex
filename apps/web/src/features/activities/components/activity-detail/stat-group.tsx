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
    <div className="grid grid-cols-3 divide-x divide-border/50">
      {items.map((item) => (
        <div key={item.label} className="min-w-0 px-3 first:pl-0 last:pr-0">
          <p className="mb-1 font-display text-[9px] text-muted-foreground uppercase tracking-[0.14em]">
            {item.label}
          </p>
          <MetricValue
            unit={item.unit}
            value={item.value}
            valueClassName="font-display text-xl tabular-nums leading-none"
          />
        </div>
      ))}
    </div>
  );
}

export { StatGroup };
