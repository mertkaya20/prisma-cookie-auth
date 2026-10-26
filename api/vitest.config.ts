/// <reference types="node" />
// Vitest'in ayar dosyası; uygulama kodu değildir, bu yüzden env'i doğrudan okur.
import "dotenv/config";
import { defineConfig } from "vitest/config";

const testDatabaseUrl = process.env["TEST_DATABASE_URL"];

// Testler tabloları boşaltır; yanlışlıkla dev veritabanına bağlanmayı engeller.
if (!testDatabaseUrl || !new URL(testDatabaseUrl).pathname.endsWith("_test")) {
  throw new Error(
    'TEST_DATABASE_URL must be set and point to a database ending with "_test"',
  );
}

// config.ts'deki dotenv var olan değeri ezmez; globalSetup ve test worker'ları bunu miras alır.
process.env["DATABASE_URL"] = testDatabaseUrl;
process.env["NODE_ENV"] = "test";
process.env["CORS_ORIGIN"] = "http://localhost:3001";

export default defineConfig({
  test: {
    globalSetup: "./src/shared/test/global-setup.ts",
    setupFiles: ["./src/shared/test/setup.ts"],
    // Tüm test dosyaları aynı veritabanını kullanır.
    fileParallelism: false,
  },
});
