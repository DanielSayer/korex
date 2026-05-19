function getDurationAxisDomain(values: (number | null)[]) {
  const numericValues = values.filter((value) => value !== null);

  if (numericValues.length === 0) {
    return ["auto", "auto"] as const;
  }

  const minValue = Math.min(...numericValues);
  const maxValue = Math.max(...numericValues);
  const range = maxValue - minValue;
  const padding = Math.max(15, Math.ceil(range * 0.15));

  return [
    Math.max(0, Math.floor(minValue - padding)),
    Math.ceil(maxValue + padding),
  ] as const;
}

function isExistingMonth(value: Date | string, selectedYear: number) {
  const monthDate = new Date(value);
  const now = new Date();

  if (selectedYear < now.getFullYear()) {
    return true;
  }

  if (selectedYear > now.getFullYear()) {
    return false;
  }

  return monthDate.getMonth() <= now.getMonth();
}

export { getDurationAxisDomain, isExistingMonth };
