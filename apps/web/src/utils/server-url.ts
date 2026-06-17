import { env } from "@korex/env/web";

function getServerUrl() {
  if (!import.meta.env.DEV || typeof window === "undefined") {
    return env.VITE_SERVER_URL;
  }

  const configuredUrl = new URL(env.VITE_SERVER_URL);
  const currentUrl = new URL(window.location.href);

  if (
    isLocalHost(configuredUrl.hostname) &&
    !isLocalHost(currentUrl.hostname)
  ) {
    return currentUrl.origin;
  }

  return env.VITE_SERVER_URL;
}

function isLocalHost(hostname: string) {
  return (
    hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]"
  );
}

export { getServerUrl };
