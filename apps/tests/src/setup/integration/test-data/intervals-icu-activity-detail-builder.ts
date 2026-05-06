import type { IntervalsIcuActivityDetail } from "@korex/integrations/intervals-icu/client";

export class IntervalsIcuActivityDetailBuilder {
  private value: IntervalsIcuActivityDetail;

  static init() {
    return new IntervalsIcuActivityDetailBuilder();
  }

  private constructor() {
    this.value = {
      distance: 1000,
      icu_intervals: [
        {
          distance: 1000,
          end_time: 300,
          start_time: 0,
        },
      ],
      id: "activity-1",
      moving_time: 300,
      name: "Morning Run",
      start_date: "2026-04-01T20:00:00.000Z",
      type: "Run",
    };
  }

  withIntervals(intervals: IntervalsIcuActivityDetail["icu_intervals"]) {
    this.value.icu_intervals = intervals;
    return this;
  }

  withType(type: string) {
    this.value.type = type;
    return this;
  }

  build() {
    return this.value;
  }
}
