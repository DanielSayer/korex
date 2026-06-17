import { describe, expect, it } from "vitest";
import {
  appNavigationItems,
  getActiveMobileTab,
  mobileTabs,
  moreNavigationItems,
  shouldHideMobileBottomNav,
} from "../../../../web/src/components/mobile-navigation";

describe("mobile navigation", () => {
  it("defines the primary mobile tabs in product order", () => {
    expect(mobileTabs.map((item) => [item.label, item.to])).toEqual([
      ["Dashboard", "/dashboard"],
      ["Calendar", "/calendar"],
      ["Analytics", "/analytics"],
      ["Goals", "/goals"],
      ["More", "/more"],
    ]);
  });

  it("defines the shared app navigation destinations", () => {
    expect(appNavigationItems.map((item) => [item.label, item.to])).toEqual([
      ["Dashboard", "/dashboard"],
      ["Calendar", "/calendar"],
      ["Analytics", "/analytics"],
      ["Goals", "/goals"],
      ["Heatmap", "/heatmap"],
      ["Weekly Summaries", "/weekly-summaries"],
      ["Settings", "/settings"],
    ]);
  });

  it("keeps secondary product areas in More", () => {
    expect(moreNavigationItems.map((item) => [item.label, item.to])).toEqual([
      ["Heatmap", "/heatmap"],
      ["Weekly Summaries", "/weekly-summaries"],
      ["Settings", "/settings"],
    ]);
  });

  it("matches canonical tab routes to their active tab", () => {
    expect(getActiveMobileTab("/dashboard")).toBe("dashboard");
    expect(getActiveMobileTab("/calendar")).toBe("calendar");
    expect(getActiveMobileTab("/analytics")).toBe("analytics");
    expect(getActiveMobileTab("/goals")).toBe("goals");
    expect(getActiveMobileTab("/more")).toBe("more");
  });

  it("matches secondary destinations to More", () => {
    expect(getActiveMobileTab("/heatmap")).toBe("more");
    expect(getActiveMobileTab("/weekly-summaries")).toBe("more");
    expect(getActiveMobileTab("/settings/profile")).toBe("more");
  });

  it("does not match unrelated paths with a shared prefix", () => {
    expect(getActiveMobileTab("/calendarish")).toBeNull();
    expect(getActiveMobileTab("/settings-old")).toBeNull();
  });

  it("hides bottom navigation on focused activity detail routes", () => {
    expect(shouldHideMobileBottomNav("/activity/activity-1")).toBe(true);
    expect(shouldHideMobileBottomNav("/weekly-summaries/2026-06-15")).toBe(
      true,
    );
    expect(shouldHideMobileBottomNav("/dashboard")).toBe(false);
    expect(shouldHideMobileBottomNav("/more")).toBe(false);
  });
});
