/** @type {import('next').NextConfig} */

// PostHog reverse proxy: route analytics through this app's own domain (/ingest)
// so ad/tracking blockers don't silently undercount funnel events.
// The assets host is derived from the ingestion host (us → us-assets, eu → eu-assets).
const POSTHOG_HOST =
  process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";
const POSTHOG_ASSETS_HOST = POSTHOG_HOST.replace(
  ".i.posthog.com",
  "-assets.i.posthog.com",
);

const nextConfig = {
  // Shared packages ship TS/TSX source, not built JS.
  transpilePackages: ["@repo/ui", "@repo/supabase", "@repo/api"],
  // Dev-only: allow a second session origin for two-account local testing.
  allowedDevOrigins: ["127.0.0.1"],
  // Required so the /ingest proxy paths below aren't lost to trailing-slash redirects.
  skipTrailingSlashRedirect: true,
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: `${POSTHOG_ASSETS_HOST}/static/:path*`,
      },
      {
        source: "/ingest/:path*",
        destination: `${POSTHOG_HOST}/:path*`,
      },
    ];
  },
};

export default nextConfig;
