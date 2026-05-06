import { z } from "zod";
import { ActivitySyncError } from "../activity-sync.errors";

const finiteNumberSchema = z.coerce.number().finite();

export function readRequiredDate(value: unknown, fieldName: string) {
  const date = readOptionalDate(value);

  if (!date) {
    throw new ActivitySyncError({
      message: `${fieldName} is missing or invalid`,
    });
  }

  return date;
}

export function readOptionalString(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function readNonNegativeInteger(value: unknown) {
  const number = readNonNegativeNumber(value);
  return number === null ? null : Math.round(number);
}

export function readPositiveInteger(value: unknown) {
  const number = readPositiveNumber(value);
  return number === null ? null : Math.round(number);
}

export function readNonNegativeNumber(value: unknown) {
  const parsed = finiteNumberSchema.safeParse(value);

  if (!parsed.success || parsed.data < 0) {
    return null;
  }

  return parsed.data;
}

export function readPositiveNumber(value: unknown) {
  const parsed = finiteNumberSchema.safeParse(value);

  if (!parsed.success || parsed.data <= 0) {
    return null;
  }

  return parsed.data;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readOptionalDate(value: unknown) {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(String(value));

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}
