export type HeartRateZoneRange = {
  minBpm: number;
  maxBpm: number | null;
};

export type HeartRateZoneSeedInput = {
  position: number;
  name: string;
  range: HeartRateZoneRange;
};
