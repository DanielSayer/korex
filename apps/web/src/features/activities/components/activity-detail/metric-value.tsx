type MetricValueProps = {
  align?: "left" | "right";
  unit?: string;
  value: string;
  valueClassName?: string;
};

function MetricValue({
  align = "left",
  unit,
  value,
  valueClassName = "font-semibold",
}: MetricValueProps) {
  if (value === "--") {
    return <span className={valueClassName}>--</span>;
  }

  return (
    <span
      className={
        align === "right"
          ? "inline-flex flex-col items-end"
          : "inline-flex flex-col"
      }
    >
      <span className={valueClassName}>{value}</span>
      {unit ? (
        <span className="mt-0.5 text-muted-foreground text-xs leading-none">
          {unit}
        </span>
      ) : null}
    </span>
  );
}

export { MetricValue };
