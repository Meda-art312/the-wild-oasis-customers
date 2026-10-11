import "server-only";
import { cache } from "react";
import { notFound } from "next/navigation";
import { getSupabase } from "./supabase";
import { positiveId } from "./booking-rules";
export const getCabin = cache(async (id) => {
  let cabinId;
  try {
    cabinId = positiveId(id);
  } catch {
    notFound();
  }
  const { data, error } = await getSupabase()
    .from("cabins")
    .select("*")
    .eq("id", cabinId)
    .maybeSingle();
  if (error) throw new Error("Cabin could not be loaded.");
  if (!data) notFound();
  return data;
});
export async function getCabins() {
  const { data, error } = await getSupabase()
    .from("cabins")
    .select("id, name, maxCapacity, regularPrice, discount, image")
    .order("name");
  if (error) throw new Error("Cabins could not be loaded.");
  return data;
}
export async function getCustomerGuest(subject) {
  const { data, error } = await getSupabase()
    .from("customer_profiles")
    .select("guests(*)")
    .eq("google_subject", subject)
    .maybeSingle();
  if (error) throw new Error("Guest profile could not be loaded.");
  return data?.guests ?? null;
}
export async function getOrCreateGuest(user, subject) {
  const { data, error } = await getSupabase().rpc("ensure_customer_guest", {
    p_google_subject: subject,
    p_email: user.email,
    p_full_name: user.name ?? "",
  });
  if (error) throw new Error("Guest profile could not be created.");
  return data;
}
export async function getGuestById(id) {
  const { data, error } = await getSupabase()
    .from("guests")
    .select("*")
    .eq("id", positiveId(id))
    .single();
  if (error) throw new Error("Guest profile could not be loaded.");
  return data;
}
export async function getBooking(id, guestId) {
  try {
    positiveId(id);
  } catch {
    notFound();
  }
  const { data, error } = await getSupabase()
    .from("bookings")
    .select("*")
    .eq("id", positiveId(id))
    .eq("guestId", positiveId(guestId))
    .maybeSingle();
  if (error) throw new Error("Reservation could not be loaded.");
  if (!data) notFound();
  return data;
}
export async function getBookings(guestId) {
  const { data, error } = await getSupabase()
    .from("bookings")
    .select(
      "id, created_at, startDate, endDate, numNights, numGuests, totalPrice, status, cabinId, cabins(name, image)",
    )
    .eq("guestId", positiveId(guestId))
    .order("startDate", { ascending: false });
  if (error) throw new Error("Reservations could not be loaded.");
  return data;
}
export async function getBookedDatesByCabinId(cabinId) {
  const { data, error } = await getSupabase()
    .from("bookings")
    .select("startDate, endDate")
    .eq("cabinId", positiveId(cabinId))
    .neq("status", "checked-out")
    .gt("endDate", new Date().toISOString().slice(0, 10));
  if (error) throw new Error("Cabin availability could not be loaded.");
  return data;
}
export async function getSettings() {
  const { data, error } = await getSupabase()
    .from("settings")
    .select("minBookingLength, maxBookingLength, maxGuestsPerBooking")
    .eq("id", 1)
    .single();
  if (error) throw new Error("Booking settings could not be loaded.");
  return data;
}
export async function getCountries() {
  const names = new Intl.DisplayNames(["en"], { type: "region" });
  return "AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW"
    .split(" ")
    .map((code) => ({
      name: names.of(code),
      flag: `https://flagcdn.com/${code.toLowerCase()}.svg`,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
