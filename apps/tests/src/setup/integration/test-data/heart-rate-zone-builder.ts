export type HeartRateZoneTestData = {
  id: number;
  maxBpm: number | null;
  minBpm: number;
  name: string;
  position: number;
  userId: string;
};

export class HeartRateZoneBuilder {
  static initWithUser(userId: string) {
    return new HeartRateZoneBuilder(userId);
  }

  private value: HeartRateZoneTestData;

  private constructor(userId: string) {
    this.value = {
      id: 1001,
      maxBpm: 140,
      minBpm: 120,
      name: "Easy",
      position: 1,
      userId,
    };
  }

  withId(id: number) {
    this.value.id = id;
    return this;
  }

  withMaxBpm(maxBpm: number | null) {
    this.value.maxBpm = maxBpm;
    return this;
  }

  withMinBpm(minBpm: number) {
    this.value.minBpm = minBpm;
    return this;
  }

  withName(name: string) {
    this.value.name = name;
    return this;
  }

  withPosition(position: number) {
    this.value.position = position;
    return this;
  }

  build(): HeartRateZoneTestData {
    return this.value;
  }
}
