import {
  InvalidProviderCredentialError,
  ProviderUnavailableError,
  runProviderConnectionEffect,
} from "@korex/api/modules/provider-connections/provider-connections.errors";
import { ProviderSecretEncryptionError } from "@korex/api/modules/provider-connections/provider-secret-encryption";
import { Effect } from "effect";
import { describe, expect, it } from "vitest";

describe("provider connection error mapping", () => {
  it.each([
    [
      new InvalidProviderCredentialError({
        message: "Invalid API key",
      }),
      "BAD_REQUEST",
    ],
    [
      new ProviderUnavailableError({
        message: "Provider failed",
      }),
      "BAD_GATEWAY",
    ],
    [
      new ProviderSecretEncryptionError({
        message: "Encryption failed",
      }),
      "INTERNAL_SERVER_ERROR",
    ],
  ])("maps %s to %s", async (effectError, expectedCode) => {
    await expect(
      runProviderConnectionEffect(Effect.fail(effectError)),
    ).rejects.toMatchObject({
      code: expectedCode,
    });
  });

  it("maps unexpected errors to internal server errors", async () => {
    await expect(
      runProviderConnectionEffect(Effect.fail(new Error("Unexpected"))),
    ).rejects.toMatchObject({
      code: "INTERNAL_SERVER_ERROR",
    });
  });
});
