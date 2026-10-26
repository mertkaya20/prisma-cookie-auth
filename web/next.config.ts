import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // next dev'in AGENTS.md üretmesini kapatır (TEKDO'daki gibi).
  agentRules: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
