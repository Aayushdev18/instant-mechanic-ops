import { getJson } from "@/lib/server-api";
import { BookingsView } from "@/components/views/bookings-view";
import type { Booking, Paginated } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string; sort?: string; order?: string }>;
}) {
  const sp = await searchParams;
  const filters = {
    q: sp.q ?? "",
    status: sp.status ?? "",
    sort: sp.sort ?? "scheduledAt",
    order: sp.order ?? "desc",
    page: Math.max(1, Number(sp.page) || 1),
  };
  const params = new URLSearchParams({
    page: String(filters.page),
    pageSize: "10",
    sort: filters.sort,
    order: filters.order,
  });
  if (filters.q) params.set("q", filters.q);
  if (filters.status) params.set("status", filters.status);
  const queryString = params.toString();
  const data = await getJson<Paginated<Booking>>(`/api/bookings?${queryString}`);
  return <BookingsView initial={data} queryString={queryString} filters={filters} />;
}
