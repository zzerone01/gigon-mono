const fs = require("fs");
const path = require("path");

/**
 * Dynamic Expo config on top of app.json.
 *
 * Two build-time inputs stay OUT of app.json so the repo builds before the
 * owner's Google accounts are wired up (each needs a REBUILD to take effect):
 * - ./google-services.json  (Firebase — required for FCM push on Android):
 *   drop the file in this directory and it's picked up automatically.
 * - GOOGLE_MAPS_ANDROID_API_KEY (Android Maps SDK key — the web key is
 *   referer-restricted and won't work): set as an EAS env var or in eas.json.
 */
module.exports = ({ config }) => {
  // Local dev: the gitignored file sits next to this config. EAS builders:
  // the archive excludes gitignored files, so the GOOGLE_SERVICES_JSON
  // file-type env var materializes it and exposes its absolute path instead.
  const googleServices =
    process.env.GOOGLE_SERVICES_JSON ?? path.join(__dirname, "google-services.json");
  const mapsKey = process.env.GOOGLE_MAPS_ANDROID_API_KEY;

  return {
    ...config,
    android: {
      ...config.android,
      ...(fs.existsSync(googleServices) ? { googleServicesFile: googleServices } : {}),
      ...(mapsKey ? { config: { googleMaps: { apiKey: mapsKey } } } : {}),
    },
  };
};
