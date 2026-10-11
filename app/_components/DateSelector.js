"use client";
import { differenceInCalendarDays, format, startOfDay } from "date-fns";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import { useReservation } from "./ReservationContext";
export default function DateSelector({ settings, cabin, bookedDates }) {
  const { range, setRange, resetRange } = useReservation();
  const numNights =
    range?.from && range?.to
      ? differenceInCalendarDays(range.to, range.from)
      : 0;
  const nightlyPrice = Number(cabin.regularPrice) - Number(cabin.discount);
  const today = startOfDay(new Date());
  return (
    <div className="flex flex-col justify-between p-4">
      <p className="text-primary-300 text-sm mb-3">
        {settings.minBookingLength}–{settings.maxBookingLength} nights per stay.
        Marked dates are occupied; departure on the next arrival date is
        allowed.
      </p>
      <DayPicker
        mode="range"
        min={settings.minBookingLength}
        max={settings.maxBookingLength}
        startMonth={today}
        endMonth={new Date(today.getFullYear() + 5, 11)}
        captionLayout="dropdown"
        numberOfMonths={1}
        selected={range}
        onSelect={(value) =>
          setRange(value ?? { from: undefined, to: undefined })
        }
        disabled={{ before: today }}
        excludeDisabled
        modifiers={{
          occupied: (date) =>
            bookedDates.some(
              (b) =>
                format(date, "yyyy-MM-dd") >= b.startDate.slice(0, 10) &&
                format(date, "yyyy-MM-dd") < b.endDate.slice(0, 10),
            ),
        }}
        modifiersClassNames={{ occupied: "line-through text-red-300" }}
        classNames={{
          today: "text-accent-400",
          selected: "bg-primary-600",
          chevron: "fill-accent-500",
        }}
      />
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-accent-500 text-primary-800">
        <p>
          <strong>${nightlyPrice}</strong> / night{" "}
          {cabin.discount > 0 && (
            <del className="ml-2">${cabin.regularPrice}</del>
          )}
        </p>
        {numNights > 0 && (
          <p>
            {numNights} nights ·{" "}
            <strong>Total ${numNights * nightlyPrice}</strong>
          </p>
        )}
        {(range?.from || range?.to) && (
          <button
            type="button"
            onClick={resetRange}
            className="border border-primary-800 px-3 py-2 text-sm"
          >
            Clear dates
          </button>
        )}
      </div>
    </div>
  );
}
