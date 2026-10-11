// Opt-in integration check: creates uniquely named QA guests/bookings and removes only those rows.
import assert from "node:assert/strict";
import fs from "node:fs";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
const env = Object.fromEntries(
  fs
    .readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1)];
    }),
);
const db = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});
const guests = [],
  bookingIds = [];
const token = randomUUID();
async function rpc(name, args) {
  const result = await db.rpc(name, args);
  if (result.error) throw new Error(result.error.message);
  return result.data;
}
try {
  const identity = {
    p_google_subject: `qa-${token}`,
    p_email: `qa-${token}@example.invalid`,
    p_full_name: "Customer integration QA",
  };
  const ids = await Promise.all([
    rpc("ensure_customer_guest", identity),
    rpc("ensure_customer_guest", identity),
  ]);
  assert.equal(ids[0], ids[1]);
  guests.push(ids[0]);
  const stranger = await rpc("ensure_customer_guest", {
    ...identity,
    p_google_subject: identity.p_google_subject + "-other",
  });
  guests.push(stranger);
  assert.notEqual(stranger, ids[0]);
  console.log(
    "PASS: identity provisioning is atomic and shared emails do not share guest records",
  );
  const { data: cabin, error: cabinError } = await db
    .from("cabins")
    .select("*")
    .order("id")
    .limit(1)
    .single();
  if (cabinError) throw cabinError;
  const { data: settings, error: settingsError } = await db
    .from("settings")
    .select("*")
    .eq("id", 1)
    .single();
  if (settingsError) throw settingsError;
  const from = new Date();
  from.setUTCFullYear(from.getUTCFullYear() + 2);
  from.setUTCMonth(0, 10);
  const to = new Date(from);
  to.setUTCDate(to.getUTCDate() + settings.minBookingLength);
  const args = {
    p_guest_id: ids[0],
    p_cabin_id: cabin.id,
    p_start_date: from.toISOString().slice(0, 10),
    p_end_date: to.toISOString().slice(0, 10),
    p_num_guests: 1,
    p_observations: `QA ${token}`,
  };
  const results = await Promise.all([
    db.rpc("create_customer_booking", args),
    db.rpc("create_customer_booking", args),
  ]);
  const successes = results.filter((r) => !r.error);
  successes.forEach((r) => bookingIds.push(r.data));
  assert.equal(successes.length, 1);
  assert.match(results.find((r) => r.error).error.message, /available/);
  console.log(
    "PASS: simultaneous overlapping reservations create exactly one booking",
  );
  const id = successes[0].data;
  const { data: booking } = await db
    .from("bookings")
    .select("*")
    .eq("id", id)
    .single();
  assert.equal(
    Number(booking.totalPrice),
    settings.minBookingLength *
      (Number(cabin.regularPrice) - Number(cabin.discount)),
  );
  assert.equal(booking.status, "unconfirmed");
  assert.equal(booking.isPaid, false);
  console.log(
    "PASS: stored nights, price, payment and status come from database rules",
  );
  assert.ok(
    (
      await db.rpc("update_customer_booking", {
        p_booking_id: id,
        p_guest_id: stranger,
        p_num_guests: 1,
        p_observations: "wrong owner",
      })
    ).error,
  );
  assert.ok(
    (
      await db.rpc("cancel_customer_booking", {
        p_booking_id: id,
        p_guest_id: stranger,
      })
    ).error,
  );
  assert.ok(
    (
      await db.rpc("update_customer_booking", {
        p_booking_id: id,
        p_guest_id: ids[0],
        p_num_guests: 999,
        p_observations: "",
      })
    ).error,
  );
  console.log(
    "PASS: another customer cannot edit/cancel, and over-capacity updates are rejected",
  );
  await rpc("update_customer_booking", {
    p_booking_id: id,
    p_guest_id: ids[0],
    p_num_guests: 1,
    p_observations: "QA updated",
  });
  const { data: updated } = await db
    .from("bookings")
    .select("observations")
    .eq("id", id)
    .single();
  assert.equal(updated.observations, "QA updated");
  await rpc("cancel_customer_booking", {
    p_booking_id: id,
    p_guest_id: ids[0],
  });
  assert.equal(
    (await db.from("bookings").select("id").eq("id", id)).data.length,
    0,
  );
  console.log("PASS: owner can update and cancel an upcoming reservation");
} finally {
  if (bookingIds.length) {
    const { error } = await db.from("bookings").delete().in("id", bookingIds);
    if (error) throw new Error("QA booking cleanup failed");
  }
  if (guests.length) {
    const { error } = await db.from("guests").delete().in("id", guests);
    if (error) throw new Error("QA guest cleanup failed");
  }
  console.log("QA cleanup complete.");
}
