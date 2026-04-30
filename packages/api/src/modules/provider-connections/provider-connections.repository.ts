import { db, providerConnections } from "@korex/db";
import { and, eq } from "drizzle-orm";
import type { Provider } from "./provider-session";

type UpsertProviderConnectionInput = {
  userId: string;
  providerUserId: string;
  providerUserName: string | null;
  authUsername: string;
  authSecretEncrypted: string;
  metadata?: unknown;
};

export async function upsertIntervalsIcuProviderConnection({
  authSecretEncrypted,
  authUsername,
  metadata,
  providerUserId,
  providerUserName,
  userId,
}: UpsertProviderConnectionInput) {
  const connection = await db.transaction(async (tx) => {
    await tx
      .update(providerConnections)
      .set({
        disconnectedAt: new Date(),
        status: "disconnected",
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(providerConnections.userId, userId),
          eq(providerConnections.status, "active"),
        ),
      );

    const [upsertedConnection] = await tx
      .insert(providerConnections)
      .values({
        authSecretEncrypted,
        authType: "basic",
        authUsername,
        disconnectedAt: null,
        metadata,
        provider: "intervals_icu",
        providerUserId,
        providerUserName,
        status: "active",
        userId,
      })
      .onConflictDoUpdate({
        target: [
          providerConnections.userId,
          providerConnections.provider,
          providerConnections.providerUserId,
        ],
        set: {
          authSecretEncrypted,
          authType: "basic",
          authUsername,
          disconnectedAt: null,
          metadata,
          providerUserName,
          status: "active",
          updatedAt: new Date(),
        },
      })
      .returning({
        id: providerConnections.id,
        provider: providerConnections.provider,
        providerUserId: providerConnections.providerUserId,
        providerUserName: providerConnections.providerUserName,
        status: providerConnections.status,
      });

    return upsertedConnection;
  });

  if (!connection) {
    throw new Error("Failed to upsert Intervals.icu provider connection");
  }

  return connection;
}

export async function getIntervalsIcuProviderConnectionForUser(userId: string) {
  const [connection] = await db
    .select({
      id: providerConnections.id,
      provider: providerConnections.provider,
      providerUserId: providerConnections.providerUserId,
      providerUserName: providerConnections.providerUserName,
      status: providerConnections.status,
    })
    .from(providerConnections)
    .where(
      and(
        eq(providerConnections.userId, userId),
        eq(providerConnections.provider, "intervals_icu"),
        eq(providerConnections.status, "active"),
      ),
    )
    .limit(1);

  return connection ?? null;
}

export async function getActiveProviderConnectionForUser({
  provider,
  userId,
}: {
  provider: Provider;
  userId: string;
}) {
  const [connection] = await db
    .select({
      authSecretEncrypted: providerConnections.authSecretEncrypted,
      authType: providerConnections.authType,
      authUsername: providerConnections.authUsername,
      id: providerConnections.id,
      provider: providerConnections.provider,
      providerUserId: providerConnections.providerUserId,
      userId: providerConnections.userId,
    })
    .from(providerConnections)
    .where(
      and(
        eq(providerConnections.userId, userId),
        eq(providerConnections.provider, provider),
        eq(providerConnections.status, "active"),
      ),
    )
    .limit(1);

  return connection ?? null;
}
