import { readPositiveNumber } from "../../anti-corruption/readers";

export function readIntervalsIcuCadenceStepsPerMinute(value: unknown) {
  const cadence = readPositiveNumber(value);
  return cadence === null ? null : Math.round(cadence * 2);
}
