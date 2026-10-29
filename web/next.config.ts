import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // next dev'in AGENTS.md üretmesini kapatır (TEKDO'daki gibi).
  agentRules: false,
  turbopack: {
    // Kök tsconfig.base.json'a erişebilmesi için Turbopack'in kökü repo kökü.
    // (Workspace olmadığından kendiliğinden web/'i kök sanıyor.)
    root: path.join(import.meta.dirname, ".."),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
