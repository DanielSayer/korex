import { useSyncExternalStore } from "react";

const mobileViewportMediaQuery = "(max-width: 767px)";

function useIsMobileViewport() {
  return useMediaQuery(mobileViewportMediaQuery);
}

function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (onStoreChange) => {
      const mediaQuery = window.matchMedia(query);

      mediaQuery.addEventListener("change", onStoreChange);
      return () => mediaQuery.removeEventListener("change", onStoreChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

export { useIsMobileViewport };
