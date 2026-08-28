import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root: a stray package.json in the home directory makes
  // Turbopack infer the wrong root and ignore this project's lockfile.
  turbopack: {
    root: path.resolve(__dirname),
  },
  images: {
    // Festival covers live in this project's Supabase Storage. Naming the host
    // rather than opting out of next/image keeps the optimisation and stops
    // arbitrary remote URLs being rendered from a column anyone can write.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "zlydzfbeaclaadjhddsq.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  // Serve the generated planner document at a clean /planner URL.
  async rewrites() {
    return [{ source: "/planner", destination: "/planner.html" }];
  },
};

export default nextConfig;
