/** @type {import('next').NextConfig} */
const nextConfig = {
  // Shared packages ship TS/TSX source, not built JS.
  transpilePackages: ["@repo/ui", "@repo/supabase", "@repo/api"],
  // Dev-only: allow a second session origin for two-account local testing.
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
