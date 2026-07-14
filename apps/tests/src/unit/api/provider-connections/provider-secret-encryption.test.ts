import {
  decryptProviderSecret,
  encryptProviderSecret,
} from "@korex/api/modules/provider-connections/provider-secret-encryption";
import { describe, expect, it } from "vitest";

describe("provider secret encryption", () => {
  it("encrypts a provider secret into a versioned payload", async () => {
    const encrypted = await encryptProviderSecret("intervals-api-key");

    expect(encrypted).toMatch(/^v1:/);
    expect(encrypted).not.toContain("intervals-api-key");
    expect(encrypted.split(":")).toHaveLength(3);
  });

  it("decrypts a known provider secret payload", async () => {
    const encrypted =
      "v1:ZWZnaGlqa2xtbm9w:Lwsomm7xjMcpXHLGlA8lkTCMGAZ/XKXN8eB4aYF98v/V";

    const decrypted = await decryptProviderSecret(encrypted);

    expect(decrypted).toBe("intervals-api-key");
  });

  it("uses a random iv for each encryption", async () => {
    const firstEncrypted = await encryptProviderSecret("intervals-api-key");
    const secondEncrypted = await encryptProviderSecret("intervals-api-key");

    expect(firstEncrypted).not.toBe(secondEncrypted);
  });

  it("fails for invalid encrypted values", async () => {
    await expect(
      decryptProviderSecret("not-an-encrypted-secret"),
    ).rejects.toMatchObject({ _tag: "ProviderSecretEncryptionError" });
  });
});
