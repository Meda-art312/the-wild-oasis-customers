"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireGuest, signIn, signOut, googleConfigured } from "./auth";
import { getSupabase } from "./supabase";
import {
  getCabin,
  getSettings,
  getBookedDatesByCabinId,
  getCountries,
} from "./data-service";
import { positiveId, validateReservation } from "./booking-rules";
export async function createBooking(previousState, formData) {
  const guest = await requireGuest();
  let bookingId;
  try {
    const cabinId = positiveId(formData.get("cabinId"));
    const [cabin, settings, bookings] = await Promise.all([
      getCabin(cabinId),
      getSettings(),
      getBookedDatesByCabinId(cabinId),
    ]);
    const validated = validateReservation(
      Object.fromEntries(formData),
      cabin,
      settings,
      bookings,
    );
    const { data, error } = await getSupabase().rpc("create_customer_booking", {
      p_guest_id: guest.guestId,
      p_cabin_id: cabinId,
      p_start_date: validated.startDate,
      p_end_date: validated.endDate,
      p_num_guests: validated.numGuests,
      p_observations: validated.observations,
    });
    if (error)
      throw new Error(
        error.code === "P0001"
          ? error.message
          : "Reservation could not be created. Please try again.",
      );
    bookingId = data;
    revalidatePath(`/cabins/${cabinId}`);
    revalidatePath("/account/reservations");
  } catch (error) {
    return { error: error.message || "Reservation could not be created." };
  }
  redirect(`/cabins/thankyou?booking=${bookingId}`);
}
export async function updateGuest(previousState, formData) {
  const guest = await requireGuest();
  try {
    const nationalID = String(formData.get("nationalID") ?? "").trim();
    if (nationalID && !/^[a-zA-Z0-9]{6,18}$/.test(nationalID))
      throw new Error(
        "Use 6–18 letters or numbers for your national ID, or leave it blank.",
      );
    const countries = await getCountries(),
      nationality = String(formData.get("nationality") ?? "");
    const country = countries.find((c) => c.name === nationality);
    if (nationality && !country)
      throw new Error("Select a country from the list.");
    const { error } = await getSupabase()
      .from("guests")
      .update({
        nationality: country?.name ?? null,
        countryFlag: country?.flag ?? null,
        nationalID: nationalID || null,
      })
      .eq("id", guest.guestId)
      .select("id")
      .single();
    if (error) throw new Error("Profile could not be updated.");
    revalidatePath("/account/profile");
    return { success: "Your profile has been updated." };
  } catch (error) {
    return { error: error.message };
  }
}
export async function deleteReservation(bookingId) {
  const guest = await requireGuest();
  try {
    const { error } = await getSupabase().rpc("cancel_customer_booking", {
      p_booking_id: positiveId(bookingId),
      p_guest_id: guest.guestId,
    });
    if (error)
      return {
        error:
          error.code === "P0001"
            ? error.message
            : "Reservation could not be cancelled.",
      };
    revalidatePath("/account/reservations");
    revalidatePath("/cabins", "layout");
    return { success: true };
  } catch {
    return { error: "Cancellation failed. Please try again." };
  }
}
export async function updateBooking(previousState, formData) {
  const guest = await requireGuest();
  try {
    const observations = String(formData.get("observations") ?? "").trim(),
      numGuests = Number(formData.get("numGuests"));
    if (
      observations.length > 1000 ||
      !Number.isInteger(numGuests) ||
      numGuests < 1
    )
      throw new Error(
        "Check the guest count and keep notes under 1,000 characters.",
      );
    const { error } = await getSupabase().rpc("update_customer_booking", {
      p_booking_id: positiveId(formData.get("bookingId")),
      p_guest_id: guest.guestId,
      p_num_guests: numGuests,
      p_observations: observations,
    });
    if (error)
      throw new Error(
        error.code === "P0001"
          ? error.message
          : "Reservation could not be updated.",
      );
  } catch (error) {
    return { error: error.message };
  }
  revalidatePath("/account/reservations");
  redirect("/account/reservations");
}
export async function signInAction() {
  if (!googleConfigured) redirect("/login");
  await signIn("google", { redirectTo: "/account" });
}
export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}
