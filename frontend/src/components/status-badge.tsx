import { Badge } from "@/components/ui/badge";
import { STATUS_COLORS, STATUS_LABELS } from "@/lib/status";
import { cn } from "@/lib/utils";

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant="outline"
      data-booking-status={status}
      data-status={status}
      className={cn("capitalize", STATUS_COLORS[status] || STATUS_COLORS.pending)}
    >
      <span className="mr-1 inline-block size-1.5 rounded-full bg-current" />
      <span data-status-label>{STATUS_LABELS[status] || status}</span>
    </Badge>
  );
}
