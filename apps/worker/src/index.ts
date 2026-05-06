import { runActivityHeartRateZoneTimeWorkerOnce } from "@korex/api/modules/activities/activity-heart-rate-zone-time-worker";

const batchSize = 10;
const pollIntervalMs = 1000;
const staleLockMs = 60_000;

let shuttingDown = false;

process.on("SIGINT", () => {
  shuttingDown = true;
});

process.on("SIGTERM", () => {
  shuttingDown = true;
});

const workerId = createWorkerId();

while (!shuttingDown) {
  try {
    const result = await runActivityHeartRateZoneTimeWorkerOnce({
      batchSize,
      staleLockMs,
      workerId,
    });

    if (result.processed > 0) {
      console.info(
        `Processed ${result.processed} activity heart-rate zone time jobs`,
      );
    }
  } catch (error) {
    console.error(error);
  }

  await sleep(pollIntervalMs);
}

function createWorkerId() {
  return `worker-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
