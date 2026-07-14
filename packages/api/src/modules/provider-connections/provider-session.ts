export type Provider = "intervals_icu";

export type ProviderSession = {
  apiKey: string;
  authType: "basic";
  connectionId: number;
  provider: "intervals_icu";
  providerUserId: string;
};

export type ProviderSessionService = {
  getActiveProviderSession: (input: {
    provider: Provider;
    userId: string;
  }) => Promise<ProviderSession>;
  getActiveProviderSessionForUser: (input: {
    userId: string;
  }) => Promise<ProviderSession>;
};
