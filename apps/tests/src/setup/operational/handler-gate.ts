export function createHandlerGate() {
  const entered = Promise.withResolvers<void>();
  const released = Promise.withResolvers<void>();
  let waiting = false;

  return {
    isWaiting: () => waiting,
    release: () => released.resolve(),
    wait: async () => {
      waiting = true;
      entered.resolve();

      try {
        await released.promise;
      } finally {
        waiting = false;
      }
    },
    waitUntilEntered: () => entered.promise,
  };
}
