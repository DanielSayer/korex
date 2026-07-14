import { createDatabaseResources } from "@korex/db";
import { describe, expect, it } from "vitest";

describe("database resources", () => {
  it("keeps each database paired with its own process pool", async () => {
    const first = createDatabaseResources(
      "postgres://postgres:postgres@localhost:5432/first",
    );
    const second = createDatabaseResources(
      "postgres://postgres:postgres@localhost:5432/second",
    );

    expect(first.database.$client).toBe(first.pool);
    expect(second.database.$client).toBe(second.pool);
    expect(first.pool).not.toBe(second.pool);

    await Promise.all([first.pool.end(), second.pool.end()]);
  });
});
