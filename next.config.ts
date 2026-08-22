import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root: a stray package.json in the home directory makes
  // Turbopack infer the wrong root and ignore this project's lockfile.
  turbopack: {
    root: path.resolve(__dirname),
  },
  // Serve the generated planner document at a clean /planner URL.
  async rewrites() {
    return [{ source: "/planner", destination: "/planner.html" }];
  },
};

export default nextConfig;
