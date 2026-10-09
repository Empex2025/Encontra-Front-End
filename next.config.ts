import type { NextConfig } from "next";

/**
 * O front chama "/api/v1/..." no próprio domínio e o Next repassa para o back-end (BACKEND_URL).
 * Assim os cookies de sessão ficam no mesmo domínio e não há problema de CORS.
 */
const backend = process.env.BACKEND_URL?.replace(/\/$/, "");

const nextConfig: NextConfig = {
  async rewrites() {
    return backend ? [{ source: "/api/v1/:path*", destination: `${backend}/api/v1/:path*` }] : [];
  },
};

export default nextConfig;
