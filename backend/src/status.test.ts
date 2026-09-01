import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { nextLiveStatus, isBookingStatus } from "./status.js";

describe("booking status pipeline", () => {
  it("advances pending through to completed", () => {
    assert.equal(nextLiveStatus("pending"), "assigned");
    assert.equal(nextLiveStatus("assigned"), "on_the_way");
    assert.equal(nextLiveStatus("on_the_way"), "in_progress");
    assert.equal(nextLiveStatus("in_progress"), "completed");
    assert.equal(nextLiveStatus("completed"), null);
    assert.equal(nextLiveStatus("cancelled"), null);
  });

  it("validates known statuses", () => {
    assert.equal(isBookingStatus("pending"), true);
    assert.equal(isBookingStatus("nope"), false);
  });
});
