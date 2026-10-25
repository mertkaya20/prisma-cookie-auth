import { execSync } from "node:child_process";

// Bütün testlerden önce bir kez: test veritabanını son şemaya getirir (yoksa oluşturur).
export default function setup() {
  execSync("npx prisma migrate deploy", { stdio: "inherit" });
}
