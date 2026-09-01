import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { compact, formatDay } from "@/lib/format";
import { STATUS_LABELS } from "@/lib/status";
import type { DashboardPayload } from "@/lib/types";

const COLORS = ["#f5a524", "#5b8def", "#3dd68c", "#f07167", "#c084fc", "#94a3b8"];

function areaPath(values: number[], width: number, height: number) {
  const max = Math.max(...values, 1);
  const step = values.length > 1 ? width / (values.length - 1) : width;
  const points = values.map((v, i) => {
    const x = i * step;
    const y = height - (v / max) * (height - 8) - 4;
    return [x, y] as const;
  });
  const line = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const last = points[points.length - 1];
  const fill = `${line} L${last[0].toFixed(1)},${height} L0,${height} Z`;
  return { line, fill };
}

function AreaChartSvg({
  values,
  labels,
  color,
  formatTick,
}: {
  values: number[];
  labels: string[];
  color: string;
  formatTick?: (n: number) => string;
}) {
  const width = 720;
  const height = 220;
  const { line, fill } = areaPath(values, width, height);
  const max = Math.max(...values, 1);
  const ticks = [0, 0.5, 1].map((p) => formatTick?.(Math.round(max * p)) ?? String(Math.round(max * p)));
  return (
    <svg viewBox={`0 0 ${width} ${height + 28}`} className="h-56 w-full" role="img">
      {ticks.map((label, i) => {
        const y = height - (i / 2) * (height - 8) - 4;
        return (
          <g key={label + i}>
            <line x1="0" x2={width} y1={y} y2={y} stroke="#333" strokeDasharray="3 3" />
            <text x="4" y={y - 4} fill="#888" fontSize="11">
              {label}
            </text>
          </g>
        );
      })}
      <path d={fill} fill={color} opacity="0.28" />
      <path d={line} fill="none" stroke={color} strokeWidth="2.5" />
      <text x="8" y={height + 22} fill="#888" fontSize="11">
        {labels[0]}
      </text>
      <text x={width - 8} y={height + 22} fill="#888" fontSize="11" textAnchor="end">
        {labels[labels.length - 1]}
      </text>
    </svg>
  );
}

function pieSlices(counts: number[]) {
  const total = counts.reduce((a, b) => a + b, 0) || 1;
  let angle = -Math.PI / 2;
  const cx = 90;
  const cy = 90;
  const r = 74;
  const inner = 42;
  return counts.map((count) => {
    const sweep = (count / total) * Math.PI * 2;
    const start = angle;
    const end = angle + sweep;
    angle = end;
    const large = sweep > Math.PI ? 1 : 0;
    const x1 = cx + r * Math.cos(start);
    const y1 = cy + r * Math.sin(start);
    const x2 = cx + r * Math.cos(end);
    const y2 = cy + r * Math.sin(end);
    const ix1 = cx + inner * Math.cos(end);
    const iy1 = cy + inner * Math.sin(end);
    const ix2 = cx + inner * Math.cos(start);
    const iy2 = cy + inner * Math.sin(start);
    return `M${x1},${y1} A${r},${r} 0 ${large} 1 ${x2},${y2} L${ix1},${iy1} A${inner},${inner} 0 ${large} 0 ${ix2},${iy2} Z`;
  });
}

export function DashboardCharts({ charts }: { charts: DashboardPayload["charts"] }) {
  const bookingValues = charts.bookingsOverTime.map((d) => d.bookings);
  const revenueValues = charts.revenueOverTime.map((d) => d.revenue);
  const bookingLabels = [
    formatDay(charts.bookingsOverTime[0]?.date ?? ""),
    formatDay(charts.bookingsOverTime.at(-1)?.date ?? ""),
  ];
  const statusCounts = charts.bookingStatus.map((s) => s.count);
  const slices = pieSlices(statusCounts);
  const maxCategory = Math.max(...charts.serviceBreakdown.map((s) => s.bookings), 1);

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card className="overflow-visible xl:col-span-2">
        <CardHeader>
          <CardTitle>Bookings over time</CardTitle>
        </CardHeader>
        <CardContent>
          <AreaChartSvg values={bookingValues} labels={bookingLabels} color={COLORS[0]} />
        </CardContent>
      </Card>

      <Card className="overflow-visible">
        <CardHeader>
          <CardTitle>Revenue over time</CardTitle>
        </CardHeader>
        <CardContent>
          <AreaChartSvg
            values={revenueValues}
            labels={bookingLabels}
            color={COLORS[1]}
            formatTick={(n) => compact(n)}
          />
        </CardContent>
      </Card>

      <Card className="overflow-visible">
        <CardHeader>
          <CardTitle>Booking status</CardTitle>
        </CardHeader>
        <CardContent>
          <svg viewBox="0 0 180 180" className="mx-auto h-52 w-52" role="img">
            {slices.map((d, i) => (
              <path key={charts.bookingStatus[i].status} d={d} fill={COLORS[i % COLORS.length]} />
            ))}
          </svg>
          <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
            {charts.bookingStatus.map((s, i) => (
              <span key={s.status} className="inline-flex items-center gap-1">
                <span className="size-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                {STATUS_LABELS[s.status] || s.status} ({s.count})
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-visible xl:col-span-2">
        <CardHeader>
          <CardTitle>Service category breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {charts.serviceBreakdown.map((row, i) => (
            <div key={row.category} className="grid grid-cols-[8rem_1fr_3rem] items-center gap-3 text-sm">
              <span className="truncate text-muted-foreground">{row.category}</span>
              <div className="h-7 rounded-md bg-muted">
                <div
                  className="h-7 rounded-md"
                  style={{
                    width: `${Math.max(6, (row.bookings / maxCategory) * 100)}%`,
                    background: COLORS[i % COLORS.length],
                  }}
                />
              </div>
              <span className="text-right tabular-nums">{row.bookings}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
