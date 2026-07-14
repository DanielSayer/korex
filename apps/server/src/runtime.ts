import { type ServerType, serve } from "@hono/node-server";

type FetchCallback = Parameters<typeof serve>[0]["fetch"];

type Pool = {
  end: () => Promise<void>;
};

type ServerListener = {
  close: () => Promise<void>;
};

type ListenOptions = {
  fetch: FetchCallback;
  hostname: string;
  port: number;
};

type ServerRuntimeDependencies = ListenOptions & {
  listen: (options: ListenOptions) => Promise<ServerListener>;
  pool: Pool;
};

export function createServerRuntime({
  fetch,
  hostname,
  listen,
  pool,
  port,
}: ServerRuntimeDependencies) {
  let listener: ServerListener | undefined;
  let poolEndPromise: Promise<void> | undefined;
  let startPromise: Promise<void> | undefined;
  let stopPromise: Promise<void> | undefined;

  const endPool = () => {
    poolEndPromise ??= pool.end();
    return poolEndPromise;
  };

  return {
    start() {
      startPromise ??= listen({ fetch, hostname, port })
        .then((startedListener) => {
          listener = startedListener;
        })
        .catch(async (error: unknown) => {
          await endPool();
          throw error;
        });

      return startPromise;
    },
    stop() {
      stopPromise ??= (async () => {
        try {
          try {
            await startPromise;
          } catch {
            return;
          }

          await listener?.close();
        } finally {
          await endPool();
        }
      })();

      return stopPromise;
    },
  };
}

export function listenForHttp({ fetch, hostname, port }: ListenOptions) {
  return new Promise<ServerListener>((resolve, reject) => {
    const server = serve({ fetch, hostname, port }, () => {
      server.off("error", reject);
      resolve({ close: () => closeServer(server) });
    });

    server.once("error", reject);
  });
}

function closeServer(server: ServerType) {
  return new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}
