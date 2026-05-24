import type { LucideIcon } from "lucide-react";

type Metric = {
  icon: LucideIcon;
  label: string;
  value: string;
};

type MetricGridProps = {
  metrics: Metric[];
};

function MetricGrid({ metrics }: MetricGridProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {metrics.map((metric) => {
        const Icon = metric.icon;

        return (
          <div key={metric.label} className="min-w-0">
            <p className="flex items-center gap-1.5 text-muted-foreground text-xs">
              <Icon className="size-3.5" />
              {metric.label}
            </p>
            <p className="mt-1 truncate font-medium">{metric.value}</p>
          </div>
        );
      })}
    </div>
  );
}

export { MetricGrid };
