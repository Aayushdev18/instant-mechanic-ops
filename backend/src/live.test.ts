import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { WebSocket } from "ws";

const api = process.env.API_URL || "http://127.0.0.1:43124";

async function apiUp() {
  try {
    const res = await fetch(`${api}/api/health`, { signal: AbortSignal.timeout(1500) });
    return res.ok;
  } catch {
    return false;
  }
}

describe("live operations API", () => {
  it("serves dashboard KPIs from the database when the API is running", async (t) => {
    if (!(await apiUp())) {
      t.skip("API not running");
      return;
    }
    const res = await fetch(`${api}/api/dashboard`);
    assert.equal(res.ok, true);
    const body = await res.json();
    assert.ok(body.kpis.totalBookings >= 500);
    assert.ok(body.kpis.totalRevenue > 0);
    assert.ok(body.charts.bookingsOverTime.length > 0);
  });

  it("accepts a WebSocket connection when the API is running", async (t) => {
    if (!(await apiUp())) {
      t.skip("API not running");
      return;
    }
    const url = api.replace("http", "ws") + "/ws";
    const message = await new Promise<string>((resolve, reject) => {
      const ws = new WebSocket(url);
      const timer = setTimeout(() => reject(new Error("ws timeout")), 4000);
      ws.on("message", (data) => {
        clearTimeout(timer);
        resolve(String(data));
        ws.close();
      });
      ws.on("error", reject);
    });
    assert.ok(message.includes("hello") || message.includes("booking"));
  });
});
