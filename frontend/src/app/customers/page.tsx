import { getJson } from "@/lib/server-api";
import { CustomersView } from "@/components/views/customers-view";
import type { Customer, Paginated } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const filters = { q: sp.q ?? "", page: Math.max(1, Number(sp.page) || 1) };
  const params = new URLSearchParams({ page: String(filters.page), pageSize: "12" });
  if (filters.q) params.set("q", filters.q);
  const queryString = params.toString();
  const data = await getJson<Paginated<Customer>>(`/api/customers?${queryString}`);
  return <CustomersView initial={data} queryString={queryString} filters={filters} />;
}
