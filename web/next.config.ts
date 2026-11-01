import path from "node:path";
import type { NextConfig } from "next";

/*
 * Tarayıcı API'ye doğrudan gitmez: /api/* istekleri buradan API'ye iletilir.
 * Böylece tarayıcı tek bir site görür ve SameSite=Lax oturum cookie'si web ile API
 * farklı alan adlarında olsa bile gönderilir (Vercel + Render).
 * Rewrite'lar build sırasında sabitlenir: API_URL build anında tanımlı olmalı.
 */
const apiUrl =
  process.env.API_URL ??
  (process.env.NODE_ENV === "production" ? undefined : "http://localhost:4001");

if (!apiUrl) {
  throw new Error("API_URL must be set for production builds");
}

const nextConfig: NextConfig = {
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${apiUrl}/:path*` }];
  },
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
