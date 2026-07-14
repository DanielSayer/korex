import { env } from "@korex/env/server";

const ALGORITHM = "AES-GCM";
const ENCRYPTED_SECRET_VERSION = "v1";
const KEY_LENGTH_BYTES = 32;
const IV_LENGTH_BYTES = 12;

export class ProviderSecretEncryptionError extends Error {
  readonly _tag = "ProviderSecretEncryptionError";
  readonly cause?: unknown;

  constructor({
    cause,
    message,
  }: {
    cause?: unknown;
    message: string;
  }) {
    super(message);
    this.name = "ProviderSecretEncryptionError";
    this.cause = cause;
  }
}

export async function encryptProviderSecret(plainText: string) {
  const key = await importEncryptionKey();
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(IV_LENGTH_BYTES));
  const encodedPlainText = new TextEncoder().encode(plainText);

  let encryptedBytes: ArrayBuffer;
  try {
    encryptedBytes = await globalThis.crypto.subtle.encrypt(
      { name: ALGORITHM, iv },
      key,
      encodedPlainText,
    );
  } catch (cause) {
    throw new ProviderSecretEncryptionError({
      cause,
      message: "Failed to encrypt provider secret",
    });
  }

  return [
    ENCRYPTED_SECRET_VERSION,
    encodeBase64(iv),
    encodeBase64(new Uint8Array(encryptedBytes)),
  ].join(":");
}

export async function decryptProviderSecret(encryptedValue: string) {
  const key = await importEncryptionKey();
  const { encryptedBytes, iv } = parseEncryptedSecret(encryptedValue);

  let decryptedBytes: ArrayBuffer;
  try {
    decryptedBytes = await globalThis.crypto.subtle.decrypt(
      { name: ALGORITHM, iv },
      key,
      encryptedBytes,
    );
  } catch (cause) {
    throw new ProviderSecretEncryptionError({
      cause,
      message: "Failed to decrypt provider secret",
    });
  }

  return new TextDecoder().decode(decryptedBytes);
}

async function importEncryptionKey() {
  try {
    const rawKey = decodeBase64(env.PROVIDER_SECRET_ENCRYPTION_KEY);

    if (rawKey.byteLength !== KEY_LENGTH_BYTES) {
      throw new Error(
        `Expected a ${KEY_LENGTH_BYTES}-byte provider secret encryption key`,
      );
    }

    return await globalThis.crypto.subtle.importKey(
      "raw",
      rawKey,
      ALGORITHM,
      false,
      ["encrypt", "decrypt"],
    );
  } catch (cause) {
    throw new ProviderSecretEncryptionError({
      cause,
      message: "Invalid provider secret encryption key",
    });
  }
}

function parseEncryptedSecret(encryptedValue: string) {
  try {
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
  } catch (cause) {
    throw new ProviderSecretEncryptionError({
      cause,
      message: "Invalid encrypted provider secret",
    });
  }
}

function encodeBase64(value: Uint8Array) {
  return Buffer.from(value).toString("base64");
}

function decodeBase64(value: string) {
  return new Uint8Array(Buffer.from(value, "base64"));
}
