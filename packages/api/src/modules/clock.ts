export type Clock = {
  now: () => Date;
};

export const systemClock = {
  now: () => new Date(),
} satisfies Clock;
