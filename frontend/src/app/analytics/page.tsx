import { getJson } from "@/lib/server-api";
import { AnalyticsView } from "@/components/views/analytics-view";
import type { DashboardPayload } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const data = await getJson<DashboardPayload>("/api/dashboard");
  return <AnalyticsView initial={data} />;
}
