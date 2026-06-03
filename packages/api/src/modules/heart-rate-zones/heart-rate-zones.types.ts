export type HeartRateZoneRange = {
  minBpm: number;
  maxBpm: number | null;
};

export type HeartRateZoneSeedInput = {
  position: number;
  name: string;
  range: HeartRateZoneRange;
};

export type HeartRateZone = {
  id: number;
  position: number;
  name: string;
  minBpm: number;
  maxBpm: number | null;
};

export type HeartRateZoneWriteInput = {
  position: number;
  name: string;
  minBpm: number;
  maxBpm: number | null;
};
