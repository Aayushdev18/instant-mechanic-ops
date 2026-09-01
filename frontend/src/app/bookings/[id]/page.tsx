import { getJson } from "@/lib/server-api";
import { BookingDetailView } from "@/components/views/booking-detail-view";
import type { Booking } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getJson<Booking>(`/api/bookings/${id}`);
  return <BookingDetailView initial={data} />;
}
