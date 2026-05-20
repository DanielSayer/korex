This repo uses bun as the default package manager. Do not use other package managers.
When running package scripts, include `run` in the command. For example, use `bun run test` instead of `bun test`, because `bun test` invokes Bun's native test runner and bypasses the repo's Vitest setup.

Never write your own migrations.
Never run the dev server - as I will have it running locally and I dont want to have 2 servers colliding.

If ever asked to do something that is:

- obviously bad practice
- will introduce code smells
- is just false
- the prompt includes false assumptions

you must push back.
