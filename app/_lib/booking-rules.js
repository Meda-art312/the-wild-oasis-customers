import {
  differenceInCalendarDays,
  format,
  isValid,
  parseISO,
  startOfDay,
} from "date-fns";
export function positiveId(value) {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id <= 0)
    throw new Error("Invalid record ID.");
  return id;
}
export function dateOnly(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    throw new Error("Please select valid arrival and departure dates.");
  const date = parseISO(value);
  if (!isValid(date) || format(date, "yyyy-MM-dd") !== value)
    throw new Error("Invalid date.");
  return date;
}
export function validateReservation(
  input,
  cabin,
  settings,
  bookings = [],
  today = new Date(),
) {
  const from = dateOnly(input.startDate),
    to = dateOnly(input.endDate);
  const numNights = differenceInCalendarDays(to, from);
  if (from < startOfDay(today))
    throw new Error("Arrival cannot be in the past.");
  if (
    numNights < settings.minBookingLength ||
    numNights > settings.maxBookingLength
  )
    throw new Error(
      `Choose between ${settings.minBookingLength} and ${settings.maxBookingLength} nights.`,
    );
  const numGuests = Number(input.numGuests);
  if (
    !Number.isInteger(numGuests) ||
    numGuests < 1 ||
    numGuests > Math.min(cabin.maxCapacity, settings.maxGuestsPerBooking)
  )
    throw new Error("Choose a valid number of guests for this cabin.");
  if (
    bookings.some(
      (b) =>
        input.startDate < b.endDate.slice(0, 10) &&
        input.endDate > b.startDate.slice(0, 10),
    )
  )
    throw new Error(
      "Those dates are no longer available. Please choose another stay.",
    );
  const observations = String(input.observations ?? "").trim();
  if (observations.length > 1000)
    throw new Error("Please keep your notes under 1,000 characters.");
  return {
    startDate: input.startDate,
    endDate: input.endDate,
    numNights,
    numGuests,
    observations,
    cabinPrice:
      numNights * (Number(cabin.regularPrice) - Number(cabin.discount)),
  };
}
export function canManageBooking(booking, today = new Date()) {
  return (
    booking.status === "unconfirmed" &&
    booking.startDate.slice(0, 10) >= format(today, "yyyy-MM-dd")
  );
}
