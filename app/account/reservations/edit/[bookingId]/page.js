import EditReservationForm from "@/app/_components/EditReservationForm";
import { requireGuest } from "@/app/_lib/auth";
import { getBooking, getCabin, getSettings } from "@/app/_lib/data-service";
import { canManageBooking } from "@/app/_lib/booking-rules";
import { notFound } from "next/navigation";
export default async function Page({ params }) {
  const guest = await requireGuest();
  const { bookingId } = await params;
  const booking = await getBooking(bookingId, guest.guestId);
  if (!canManageBooking(booking)) notFound();
  const [cabin, settings] = await Promise.all([
    getCabin(booking.cabinId),
    getSettings(),
  ]);
  return (
    <div>
      <h2 className="font-semibold text-2xl text-accent-400 mb-7">
        Edit Reservation #{booking.id}
      </h2>
      <EditReservationForm
        booking={booking}
        maxGuests={Math.min(cabin.maxCapacity, settings.maxGuestsPerBooking)}
      />
    </div>
  );
}
