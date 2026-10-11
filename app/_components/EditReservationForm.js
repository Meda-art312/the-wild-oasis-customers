"use client";
import { useActionState } from "react";
import { updateBooking } from "../_lib/actions";
import SubmitButton from "./SubmitButton";
export default function EditReservationForm({ booking, maxGuests }) {
  const [state, action] = useActionState(updateBooking, {});
  return (
    <form
      action={action}
      className="bg-primary-900 p-6 md:p-10 text-lg flex gap-6 flex-col"
    >
      <input type="hidden" value={booking.id} name="bookingId" />
      <label htmlFor="numGuests">How many guests?</label>
      <select
        id="numGuests"
        name="numGuests"
        defaultValue={booking.numGuests}
        required
        className="p-3 bg-primary-200 text-primary-800"
      >
        {Array.from({ length: maxGuests }, (_, i) => i + 1).map((n) => (
          <option key={n} value={n}>
            {n} {n === 1 ? "guest" : "guests"}
          </option>
        ))}
      </select>
      <label htmlFor="observations">
        Anything we should know about your stay?
      </label>
      <textarea
        id="observations"
        name="observations"
        defaultValue={booking.observations}
        maxLength={1000}
        className="p-3 bg-primary-200 text-primary-800"
      />
      {state.error && (
        <p role="alert" className="text-red-300">
          {state.error}
        </p>
      )}
      <SubmitButton pendingLabel="Updating...">Update reservation</SubmitButton>
    </form>
  );
}
