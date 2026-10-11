import { getBookedDatesByCabinId, getCabin } from "@/app/_lib/data-service";
export async function GET(req, { params }) {
  const { cabinId } = await params;
  if (
    !/^\d+$/.test(cabinId) ||
    !Number.isSafeInteger(Number(cabinId)) ||
    Number(cabinId) < 1
  )
    return Response.json({ message: "Cabin not found" }, { status: 404 });
  try {
    const [cabin, bookedDates] = await Promise.all([
      getCabin(cabinId),
      getBookedDatesByCabinId(cabinId),
    ]);
    return Response.json(
      { cabin, bookedDates },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error.digest?.startsWith("NEXT_HTTP_ERROR_FALLBACK;404"))
      return Response.json({ message: "Cabin not found" }, { status: 404 });
    return Response.json(
      { message: "Cabin could not be loaded" },
      { status: 503 },
    );
  }
}
