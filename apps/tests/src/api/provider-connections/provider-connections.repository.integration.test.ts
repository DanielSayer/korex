import {
  getIntervalsIcuProviderConnectionForUser,
  upsertIntervalsIcuProviderConnection,
} from "@korex/api/modules/provider-connections/provider-connections.repository";
import { db, providerConnections } from "@korex/db";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { DataSeedAsync } from "../../setup/integration/test-data/data-seed";
import { ProviderConnectionBuilder } from "../../setup/integration/test-data/provider-connection-builder";
import { userDataExtensions } from "../../setup/integration/test-data/user-data-extensions";

describe("provider connections repository", () => {
  it("upserts an Intervals.icu provider connection", async () => {
    const upserted = await upsertIntervalsIcuProviderConnection({
      authSecretEncrypted: "encrypted-api-key",
      authUsername: "API_KEY",
      metadata: {
        id: "athlete-1",
      },
      providerUserId: "athlete-1",
      providerUserName: "Integration Athlete",
      userId: userDataExtensions.HughJass.id,
    });

    const [connection] = await db
      .select()
      .from(providerConnections)
      .where(eq(providerConnections.id, upserted.id));

    expect(connection).toMatchObject({
      authSecretEncrypted: "encrypted-api-key",
      authType: "basic",
      authUsername: "API_KEY",
      disconnectedAt: null,
      id: upserted.id,
      provider: "intervals_icu",
      providerUserId: "athlete-1",
      providerUserName: "Integration Athlete",
      status: "active",
      userId: userDataExtensions.HughJass.id,
    });
  });

  it("keeps only one active provider connection for a user", async () => {
    const existingConnection = ProviderConnectionBuilder.initWithUser(
      userDataExtensions.HughJass.id,
    )
      .withProviderUserId("athlete-1")
      .withProviderUserName("Previous Athlete")
      .build();

    await DataSeedAsync.withProviderConnections(existingConnection).seedAsync();

    const upserted = await upsertIntervalsIcuProviderConnection({
      authSecretEncrypted: "new-encrypted-api-key",
      authUsername: "API_KEY",
      providerUserId: "athlete-2",
      providerUserName: "New Athlete",
      userId: userDataExtensions.HughJass.id,
    });

    const connections = await db
      .select({
        id: providerConnections.id,
        providerUserId: providerConnections.providerUserId,
        status: providerConnections.status,
      })
      .from(providerConnections)
      .where(eq(providerConnections.userId, userDataExtensions.HughJass.id));

    expect(connections).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          providerUserId: existingConnection.providerUserId,
          status: "disconnected",
        }),
        expect.objectContaining({
          id: upserted.id,
          providerUserId: "athlete-2",
          status: "active",
        }),
      ]),
    );
    expect(
      connections.filter((connection) => connection.status === "active"),
    ).toHaveLength(1);
  });

  it("gets an Intervals.icu provider connection for a user", async () => {
    const providerConnection = ProviderConnectionBuilder.initWithUser(
      userDataExtensions.HughJass.id,
    )
      .withProviderUserId("athlete-1")
      .withProviderUserName("Integration Athlete")
      .build();

    await DataSeedAsync.withProviderConnections(providerConnection).seedAsync();

    const connection = await getIntervalsIcuProviderConnectionForUser(
      userDataExtensions.HughJass.id,
    );

    expect(connection).toEqual({
      id: expect.any(Number),
      provider: providerConnection.provider,
      providerUserId: providerConnection.providerUserId,
      providerUserName: providerConnection.providerUserName,
      status: providerConnection.status,
    });
  });
});
