import { env } from "@korex/env/server";
import { Data, Effect } from "effect";

const ALGORITHM = "AES-GCM";
const ENCRYPTED_SECRET_VERSION = "v1";
const KEY_LENGTH_BYTES = 32;
const IV_LENGTH_BYTES = 12;

export class ProviderSecretEncryptionError extends Data.TaggedError(
  "ProviderSecretEncryptionError",
)<{
  cause?: unknown;
  message: string;
}> {}

export function encryptProviderSecret(
  plainText: string,
): Effect.Effect<string, ProviderSecretEncryptionError> {
  return Effect.gen(function* () {
    const key = yield* importEncryptionKey;
    const iv = globalThis.crypto.getRandomValues(
      new Uint8Array(IV_LENGTH_BYTES),
    );
    const encodedPlainText = new TextEncoder().encode(plainText);

    const encryptedBytes = yield* Effect.tryPromise({
      try: () =>
        globalThis.crypto.subtle.encrypt(
          { name: ALGORITHM, iv },
          key,
          encodedPlainText,
        ),
      catch: (cause) =>
        new ProviderSecretEncryptionError({
          cause,
          message: "Failed to encrypt provider secret",
        }),
    });

    return [
      ENCRYPTED_SECRET_VERSION,
      encodeBase64(iv),
      encodeBase64(new Uint8Array(encryptedBytes)),
    ].join(":");
  });
}

export function decryptProviderSecret(
  encryptedValue: string,
): Effect.Effect<string, ProviderSecretEncryptionError> {
  return Effect.gen(function* () {
    const key = yield* importEncryptionKey;
    const { encryptedBytes, iv } = yield* parseEncryptedSecret(encryptedValue);

    const decryptedBytes = yield* Effect.tryPromise({
      try: () =>
        globalThis.crypto.subtle.decrypt(
          { name: ALGORITHM, iv },
          key,
          encryptedBytes,
        ),
      catch: (cause) =>
        new ProviderSecretEncryptionError({
          cause,
          message: "Failed to decrypt provider secret",
        }),
    });

    return new TextDecoder().decode(decryptedBytes);
  });
}

const importEncryptionKey = Effect.tryPromise({
  try: async () => {
    const rawKey = decodeBase64(env.PROVIDER_SECRET_ENCRYPTION_KEY);

    if (rawKey.byteLength !== KEY_LENGTH_BYTES) {
      throw new Error(
        `Expected a ${KEY_LENGTH_BYTES}-byte provider secret encryption key`,
      );
    }

    return globalThis.crypto.subtle.importKey("raw", rawKey, ALGORITHM, false, [
      "encrypt",
      "decrypt",
    ]);
  },
  catch: (cause) =>
    new ProviderSecretEncryptionError({
      cause,
      message: "Invalid provider secret encryption key",
    }),
});

function parseEncryptedSecret(encryptedValue: string) {
  return Effect.try({
    try: () => {
      const [version, encodedIv, encodedEncryptedBytes] =
        encryptedValue.split(":");

      if (
        version !== ENCRYPTED_SECRET_VERSION ||
        !encodedIv ||
        !encodedEncryptedBytes
      ) {
        throw new Error("Invalid encrypted provider secret format");
      }

      const iv = decodeBase64(encodedIv);

      if (iv.byteLength !== IV_LENGTH_BYTES) {
        throw new Error(`Expected a ${IV_LENGTH_BYTES}-byte IV`);
      }

      return {
        encryptedBytes: decodeBase64(encodedEncryptedBytes),
        iv,
      };
    },
    catch: (cause) =>
      new ProviderSecretEncryptionError({
        cause,
        message: "Invalid encrypted provider secret",
      }),
  });
}

function encodeBase64(value: Uint8Array) {
  return Buffer.from(value).toString("base64");
}

function decodeBase64(value: string) {
  return new Uint8Array(Buffer.from(value, "base64"));
}
