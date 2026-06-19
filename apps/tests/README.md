# Tests

`pnpm run test` runs unit and integration tests through Vitest.

## Conventions

Test behavior at the boundary where it matters.

- Unit test pure domain logic, mappers, validators, parsers, error mapping, and
  other deterministic functions.
- Do not unit test application services by mocking every dependency. That tends
  to test choreography instead of behavior.
- Test repositories with integration tests. Their behavior depends on database
  constraints, conflict targets, defaults, and generated values.
- Test application services with integration tests when the useful behavior is
  the full workflow. Use real internal services and persistence.
- Mock external systems at the edge only. For example, use a fake HTTP client to
  avoid calling a third-party API while keeping the real integration client,
  parser, service, and repository code.

Assertions should prove semantic behavior, not incidental implementation
details. Prefer checking meaningful fields such as status, counters, ownership,
foreign keys, stored payloads, and conflict behavior. Avoid asserting generated
timestamps, hashes, and audit fields unless they are the behavior under test.

Keep fixtures explicit. Prefer builders in `src/setup/integration/test-data`
over private helper functions hidden in test files when setup is reused or has
domain meaning.

Integration tests are files named `*.integration.test.ts`. They run against an
isolated Postgres container from `docker-compose.integration.yml`.

The integration harness creates one Postgres container for the Vitest run and one
database per integration test file. Before each test, all tables in that file's
database are truncated and `src/setup/integration/seed.ts` is called.

Add shared baseline seed data in `src/setup/integration/seed.ts`, and export
canonical seed values from `src/setup/integration/test-data`. Prefer test-local
builders for data that is specific to one behavior.

## Integration test data

Integration test data uses two separate concepts:

- Test builders create plain test-data objects.
- `DataSeedAsync` inserts those plain objects into the database.

Builders should not import `@korex/db`, Drizzle tables, or schema types. Keep
them decoupled from persistence by defining an explicit test-data type in the
builder file. The seeder is the database boundary and is responsible for mapping
test-data objects into Drizzle insert objects.

Example:

```ts
const providerConnection = ProviderConnectionBuilder.initWithUser(
  userDataExtensions.HughJass.id,
)
  .withProviderUserId("athlete-1")
  .withProviderUserName("Integration Athlete")
  .build();

await DataSeedAsync.withProviderConnections(providerConnection).seedAsync();
```

Calling `.build()` in the test is intentional. It gives the test access to the
primitive values it asked for, so assertions can compare against the test data
instead of against rows returned by the seeder.

To add another builder:

1. Create a file under `src/setup/integration/test-data`.
2. Define a plain `...TestData` type for the values tests care about.
3. Add a builder with a static initializer, such as `initWithUser`, and
   chainable `with...` methods that mutate the builder value and return `this`.
4. Add a `with...` method to `DataSeedAsync` for the new test-data type.
5. Add a mapper in `data-seed.ts` that converts the test-data type to the
   relevant Drizzle insert type.

This keeps test setup readable while limiting database coupling to
`data-seed.ts`.

If a test process is interrupted, remove stale integration containers and volumes
with:

```sh
pnpm run test:integration:clean
```
