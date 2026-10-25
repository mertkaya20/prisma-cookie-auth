import request from "supertest";
import { describe, expect, it } from "vitest";
import { server } from "./server.js";

describe("GET /health", () => {
  it("returns 200", async () => {
    const res = await request(server).get("/health");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "OK" });
  });
});
