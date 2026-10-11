"use client";
import { useOptimistic, useState } from "react";
import ReservationCard from "./ReservationCard";
import { deleteReservation } from "../_lib/actions";
export default function ReservationList({ bookings }) {
  const [error, setError] = useState("");
  const [optimisticBookings, optimisticDelete] = useOptimistic(
    bookings,
    (current, id) => current.filter((b) => b.id !== id),
  );
  async function handleDelete(id) {
    setError("");
    optimisticDelete(id);
    try {
      const result = await deleteReservation(id);
      if (result.error) setError(result.error);
    } catch {
      setError("Cancellation failed. Please try again.");
    }
  }
  return (
    <>
      {error && (
        <p role="alert" className="text-red-300 mb-4">
          {error}
        </p>
      )}
      <div className="space-y-6">
        {optimisticBookings.map((b) => (
          <ReservationCard booking={b} onDelete={handleDelete} key={b.id} />
        ))}
      </div>
    </>
  );
}
