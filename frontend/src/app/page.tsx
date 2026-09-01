import { getJson } from "@/lib/server-api";
import { OverviewView } from "@/components/views/overview-view";
import type { DashboardPayload } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  const data = await getJson<DashboardPayload>("/api/dashboard");
  return <OverviewView initial={data} />;
}
