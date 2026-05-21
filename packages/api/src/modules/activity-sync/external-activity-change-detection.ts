import { createHash } from "node:crypto";

export function hashExternalActivityPayload(payload: unknown) {
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

export function hasExternalActivityPayloadChanged({
  nextPayloadHash,
  previousPayloadHash,
}: {
  nextPayloadHash: string;
  previousPayloadHash: string | null;
}) {
  return previousPayloadHash !== nextPayloadHash;
}
