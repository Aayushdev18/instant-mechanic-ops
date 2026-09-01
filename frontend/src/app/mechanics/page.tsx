import { getJson } from "@/lib/server-api";
import { MechanicsView } from "@/components/views/mechanics-view";
import type { Mechanic } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function MechanicsPage() {
  const data = await getJson<Mechanic[]>("/api/mechanics");
  return <MechanicsView initial={data} />;
}
