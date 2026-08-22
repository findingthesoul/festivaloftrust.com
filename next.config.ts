import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root: a stray package.json in the home directory makes
  // Turbopack infer the wrong root and ignore this project's lockfile.
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
