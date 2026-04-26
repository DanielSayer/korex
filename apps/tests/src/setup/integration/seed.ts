import { userDataExtensions } from "./test-data/user-data-extensions";

export type SeedIntegrationDbOptions = {
  databaseName: string;
  databaseUrl: string;
};

export async function seedIntegrationDb(
  _options: SeedIntegrationDbOptions,
): Promise<void> {
  const { db, user } = await import("@korex/db");

  await db.insert(user).values(userDataExtensions.HughJass);
}
