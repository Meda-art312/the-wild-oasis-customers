import test from "node:test";
import assert from "node:assert/strict";
import {
  dateOnly,
  positiveId,
  validateReservation,
  canManageBooking,
} from "../app/_lib/booking-rules.js";
const cabin = { maxCapacity: 4, regularPrice: 200, discount: 20 };
const settings = {
  minBookingLength: 3,
  maxBookingLength: 30,
  maxGuestsPerBooking: 10,
};
const today = new Date("2026-10-01T00:00:00");
const input = {
  startDate: "2026-10-29",
  endDate: "2026-11-01",
  numGuests: "2",
  observations: "Hi",
};
test("prices and nights are recomputed, ignoring browser totals", () => {
  const result = validateReservation(
    { ...input, cabinPrice: 1, numNights: 100 },
    cabin,
    settings,
    [],
    today,
  );
  assert.equal(result.numNights, 3);
  assert.equal(result.cabinPrice, 540);
});
test("calendar nights survive Cairo daylight-saving changes", () => {
  const old = process.env.TZ;
  process.env.TZ = "Africa/Cairo";
  try {
    assert.equal(
      validateReservation(input, cabin, settings, [], today).numNights,
      3,
    );
  } finally {
    if (old) process.env.TZ = old;
    else delete process.env.TZ;
  }
});
test("half-open stays allow same-day checkout and next check-in", () => {
  assert.doesNotThrow(() =>
    validateReservation(
      input,
      cabin,
      settings,
      [{ startDate: "2026-11-01T00:00:00Z", endDate: "2026-11-04T00:00:00Z" }],
      today,
    ),
  );
  assert.doesNotThrow(() =>
    validateReservation(
      input,
      cabin,
      settings,
      [{ startDate: "2026-10-26T00:00:00Z", endDate: "2026-10-29T00:00:00Z" }],
      today,
    ),
  );
});
test("overlap is rejected even when occupied dates fall inside the stay", () => {
  assert.throws(
    () =>
      validateReservation(
        input,
        cabin,
        settings,
        [
          {
            startDate: "2026-10-30T00:00:00Z",
            endDate: "2026-10-31T00:00:00Z",
          },
        ],
        today,
      ),
    /available/,
  );
});
test("past dates, invalid dates, short stays, capacity and oversized notes are rejected", () => {
  for (const change of [
    { startDate: "2026-09-01" },
    { startDate: "2026-02-30" },
    { endDate: "2026-10-30" },
    { numGuests: "2.5" },
    { numGuests: "5" },
    { observations: "a".repeat(1001) },
  ]) {
    assert.throws(() =>
      validateReservation({ ...input, ...change }, cabin, settings, [], today),
    );
  }
});
test("hotel-wide capacity also limits the cabin", () =>
  assert.throws(() =>
    validateReservation(
      { ...input, numGuests: 3 },
      cabin,
      { ...settings, maxGuestsPerBooking: 2 },
      [],
      today,
    ),
  ));
test("record IDs and strict ISO dates reject malformed input", () => {
  for (const id of ["0", "-2", "1.5", "abc", null])
    assert.throws(() => positiveId(id));
  for (const date of ["2026-2-01", "2026-02-30", "2026-10-10T00:00:00Z"])
    assert.throws(() => dateOnly(date));
});
test("only upcoming unconfirmed bookings expose edit and cancel controls", () => {
  const b = { startDate: "2026-11-01T00:00:00Z", status: "unconfirmed" };
  assert.equal(canManageBooking(b, today), true);
  assert.equal(canManageBooking({ ...b, status: "checked-in" }, today), false);
  assert.equal(
    canManageBooking({ ...b, startDate: "2026-09-01T00:00:00Z" }, today),
    false,
  );
});
