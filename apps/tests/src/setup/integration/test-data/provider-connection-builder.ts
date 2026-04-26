type ProviderConnectionStatus = "active" | "disconnected" | "expired" | "error";
type ProviderAuthType = "basic" | "oauth";
type ExternalProvider = "intervals_icu";

export type ProviderConnectionTestData = {
  authSecretEncrypted: string;
  authType: ProviderAuthType;
  authUsername: string;
  provider: ExternalProvider;
  providerUserId: string;
  providerUserName: string | null;
  status: ProviderConnectionStatus;
  userId: string;
};

export class ProviderConnectionBuilder {
  private value: ProviderConnectionTestData;

  static initWithUser(userId: string) {
    return new ProviderConnectionBuilder(userId);
  }

  private constructor(userId: string) {
    this.value = {
      authSecretEncrypted: "encrypted-api-key",
      authType: "basic",
      authUsername: "API_KEY",
      provider: "intervals_icu",
      providerUserId: "athlete-1",
      providerUserName: "Integration Athlete",
      status: "active",
      userId,
    };
  }

  withAuthSecretEncrypted(authSecretEncrypted: string) {
    this.value.authSecretEncrypted = authSecretEncrypted;
    return this;
  }

  withAuthUsername(authUsername: string) {
    this.value.authUsername = authUsername;
    return this;
  }

  withProviderUserId(providerUserId: string) {
    this.value.providerUserId = providerUserId;
    return this;
  }

  withProviderUserName(providerUserName: string | null) {
    this.value.providerUserName = providerUserName;
    return this;
  }

  withStatus(status: ProviderConnectionStatus) {
    this.value.status = status;
    return this;
  }

  build() {
    return this.value;
  }
}
