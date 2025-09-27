import { Platform } from "react-native";
import Constants from "expo-constants";

// Resolve a backend URL that works across emulator, device, and dev client.
// Priority:
// 1. expo.extra.API_URL from app.json/app.config
// 2. EXPO_PUBLIC_RIDER_BACKEND_URL env var
// 3. Derive from Expo packager host (LAN) if available
// 4. Fallback to localhost (mapped for Android emulator)
export function getBackendBaseUrl() {
  let raw = undefined;

  try {
    raw =
      Constants?.expoConfig?.extra?.API_URL ??
      Constants?.manifest2?.extra?.expoClient?.extra?.API_URL ??
      Constants?.manifest?.extra?.API_URL;
  } catch (_) {
    // noop
  }

  if (!raw || String(raw).trim() === "") {
    // eslint-disable-next-line no-undef
    raw = process.env?.EXPO_PUBLIC_RIDER_BACKEND_URL;
  }

  if (!raw || String(raw).trim() === "") {
    try {
      const hostUri =
        Constants.expoConfig?.hostUri ||
        Constants.manifest2?.extra?.expoClient?.hostUri ||
        Constants.manifest?.debuggerHost;
      if (hostUri && hostUri.includes(":")) {
        const host = hostUri.split(":")[0];
        raw = `http://${host}:3012`;
      }
    } catch (_) {
      // noop
    }
  }

  if (!raw || String(raw).trim() === "") {
    raw = "http://localhost:3012";
  }

  // Normalize when "localhost" is used (common in config) so it works on:
  // - Android emulator: use 10.0.2.2
  // - Physical devices / Expo Go: use the Metro bundler host IP
  // - iOS simulator: localhost works already, but we can still map if hostUri exists
  const isLocalHost = /^(http:\/\/)(localhost|127\.0\.0\.1)(:\d+)?/i.test(
    raw
  );

  if (isLocalHost) {
    // Android emulator special host
    if (Platform.OS === "android") {
      raw = raw.replace(/localhost|127\.0\.0\.1/, "10.0.2.2");
    } else {
      // Try to derive LAN IP from Expo/Metro hostUri, so physical devices can reach the dev machine
      try {
        const hostUri =
          Constants.expoConfig?.hostUri ||
          Constants.manifest2?.extra?.expoClient?.hostUri ||
          Constants.manifest?.debuggerHost ||
          "";

        // hostUri examples: "192.168.1.10:8081", "192.168.0.42:19000"
        const host = hostUri.includes(":") ? hostUri.split(":")[0] : hostUri;
        if (host && /^(\d{1,3}\.){3}\d{1,3}$/.test(host)) {
          raw = raw.replace(/localhost|127\.0\.0\.1/i, host);
        }
      } catch (_) {
        // noop
      }
    }
  }

  return String(raw).replace(/\/$/, ""); // remove trailing slash if any
}
