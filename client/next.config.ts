import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow HMR websocket connections from LAN devices (e.g. phone, tablet, other PC)
  // Add any other IPs you need here. This only applies in development.
  allowedDevOrigins: ['192.168.1.5'],
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
