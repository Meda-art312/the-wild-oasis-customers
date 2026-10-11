import Link from "next/link";
import { requireGuest } from "@/app/_lib/auth";
import { getBooking } from "@/app/_lib/data-service";
export const metadata = { title: "Reservation confirmed" };
export default async function Page({ searchParams }) {
  const guest = await requireGuest(),
    { booking: bookingId } = await searchParams;
  const booking = await getBooking(bookingId, guest.guestId);
  return (
    <div className="text-center space-y-8 mt-16">
      <h1 className="text-4xl text-accent-400">Your cabin is reserved!</h1>
      <p>Reservation #{booking.id} is confirmed. Payment is due on arrival.</p>
      <Link
        className="inline-block bg-accent-500 text-primary-900 px-8 py-4"
        href="/account/reservations"
      >
        View your reservations &rarr;
      </Link>
    </div>
  );
}
