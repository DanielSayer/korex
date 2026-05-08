export type ProviderPayloadDetails =
  | {
      length: number;
      sample: ProviderPayloadDetails[];
      type: "array";
    }
  | {
      keys: string[];
      keyCount: number;
      type: "object";
    }
  | {
      type: string;
    };

export function getErrorDetails(error: unknown) {
  if (!isRecord(error) || !("details" in error)) {
    return null;
  }

  return error.details;
}

export function getProviderPayloadDetails(
  value: unknown,
): ProviderPayloadDetails {
  if (Array.isArray(value)) {
    return {
      length: value.length,
      sample: value.slice(0, 3).map(getProviderPayloadDetails),
      type: "array",
    };
  }

  if (isRecord(value)) {
    const keys = Object.keys(value);

    return {
      keys: keys.slice(0, 20),
      keyCount: keys.length,
      type: "object",
    };
  }

  return {
    type: value === null ? "null" : typeof value,
  };
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
