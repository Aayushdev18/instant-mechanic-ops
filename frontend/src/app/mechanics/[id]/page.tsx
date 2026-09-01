import { getJson } from "@/lib/server-api";
import { MechanicDetailView } from "@/components/views/mechanic-detail-view";
import type { Mechanic } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function MechanicDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getJson<Mechanic>(`/api/mechanics/${id}`);
  return <MechanicDetailView initial={data} />;
}
