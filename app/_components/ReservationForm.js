"use client";
import { useActionState } from "react";
import { format } from "date-fns";
import { createBooking } from "../_lib/actions";
import { validateReservation } from "../_lib/booking-rules";
import { useReservation } from "./ReservationContext";
import SubmitButton from "./SubmitButton";

export default function ReservationForm({
  cabin,
  user,
  settings,
  bookedDates,
}) {
  const { range } = useReservation();
  const [state, action] = useActionState(createBooking, {});
  let dateError = "";
  if (range?.from && range?.to) {
    try {
      validateReservation(
        {
          startDate: format(range.from, "yyyy-MM-dd"),
          endDate: format(range.to, "yyyy-MM-dd"),
          numGuests: 1,
        },
        cabin,
        settings,
        bookedDates,
      );
    } catch (error) {
      dateError = error.message;
    }
  }
  const ready = range?.from && range?.to && !dateError;
  return (
    <div className="pt-8">
      <div className="bg-primary-800 text-primary-300 px-6 py-3">
        Logged in as {user.name}
      </div>
      <form
        action={action}
        className="bg-primary-900 p-6 lg:p-10 text-lg flex gap-5 flex-col"
      >
        <input type="hidden" name="cabinId" value={cabin.id} />
        <input
          type="hidden"
          name="startDate"
          value={range?.from ? format(range.from, "yyyy-MM-dd") : ""}
        />
        <input
          type="hidden"
          name="endDate"
          value={range?.to ? format(range.to, "yyyy-MM-dd") : ""}
        />
        <div className="space-y-2">
          <label htmlFor="numGuests">How many guests?</label>
          <select
            name="numGuests"
            id="numGuests"
            required
            className="px-5 py-3 bg-primary-200 text-primary-800 w-full rounded-sm"
          >
            <option value="">Select number of guests...</option>
            {Array.from(
              {
                length: Math.min(
                  cabin.maxCapacity,
                  settings.maxGuestsPerBooking,
                ),
              },
              (_, i) => i + 1,
            ).map((n) => (
              <option value={n} key={n}>
                {n} {n === 1 ? "guest" : "guests"}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label htmlFor="observations">
            Anything we should know about your stay?
          </label>
          <textarea
            name="observations"
            id="observations"
            maxLength={1000}
            className="px-5 py-3 bg-primary-200 text-primary-800 w-full rounded-sm"
            placeholder="Pets, allergies, special requirements..."
          />
        </div>
        <p className="text-sm text-primary-300">
          Pay on arrival. Breakfast can be added at check-in.
        </p>
        {dateError && (
          <p role="alert" className="text-red-300">
            {dateError}
          </p>
        )}
        {state.error && (
          <p role="alert" className="text-red-300">
            {state.error}
          </p>
        )}
        {!ready && !dateError && (
          <p>Start by selecting your arrival and departure dates.</p>
        )}
        <SubmitButton disabled={!ready} pendingLabel="Reserving...">
          Reserve now
        </SubmitButton>
      </form>
    </div>
  );
}
