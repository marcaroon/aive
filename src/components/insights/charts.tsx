"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const AXIS_STYLE = { fontSize: 11, fill: "var(--color-muted)" } as const;
const GRID_COLOR = "var(--color-line)";

/**
 * Charts carry a text summary as well, because a graph alone is not accessible
 * and the spec asks for simple, mobile-readable visuals.
 */
function ChartFrame({
  title,
  summary,
  children,
}: {
  title: string;
  summary: string;
  children: React.ReactElement;
}) {
  return (
    <section className="card p-5">
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="mt-0.5 text-xs text-[var(--color-muted)]">{summary}</p>
      <div className="mt-3 h-44 w-full" role="img" aria-label={`${title}. ${summary}`}>
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </section>
  );
}

export function CycleLengthChart({
  data,
}: {
  data: Array<{ label: string; length: number }>;
}) {
  const lengths = data.map((entry) => entry.length);
  const summary = `Cycle length ranges from ${Math.min(...lengths)} to ${Math.max(...lengths)} days across your last ${data.length} cycles.`;

  return (
    <ChartFrame title="Cycle length" summary={summary}>
      <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
        <CartesianGrid stroke={GRID_COLOR} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="label" tick={AXIS_STYLE} axisLine={false} tickLine={false} />
        <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} width={36} />
        <Tooltip
          contentStyle={{
            borderRadius: 14,
            border: `1px solid ${GRID_COLOR}`,
            fontSize: 12,
          }}
        />
        <Line
          type="monotone"
          dataKey="length"
          name="Days"
          stroke="var(--color-primary-deep)"
          strokeWidth={2}
          dot={{ r: 3 }}
        />
      </LineChart>
    </ChartFrame>
  );
}

export function PainTrendChart({ data }: { data: Array<{ date: string; pain: number }> }) {
  const values = data.map((entry) => entry.pain);
  const summary = `Pain ranges from ${Math.min(...values)} to ${Math.max(...values)} across your last ${data.length} logged days.`;

  return (
    <ChartFrame title="Pain over time" summary={summary}>
      <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
        <CartesianGrid stroke={GRID_COLOR} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="date" tick={AXIS_STYLE} axisLine={false} tickLine={false} hide />
        <YAxis domain={[0, 10]} tick={AXIS_STYLE} axisLine={false} tickLine={false} width={36} />
        <Tooltip
          contentStyle={{
            borderRadius: 14,
            border: `1px solid ${GRID_COLOR}`,
            fontSize: 12,
          }}
        />
        <Line
          type="monotone"
          dataKey="pain"
          name="Pain"
          stroke="var(--color-pain)"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ChartFrame>
  );
}

export function FrequencyChart({
  title,
  data,
  color,
}: {
  title: string;
  data: Array<{ value: string; count: number }>;
  color: string;
}) {
  const summary = data
    .slice(0, 3)
    .map((entry) => `${entry.value} ${entry.count}×`)
    .join(", ");

  return (
    <ChartFrame title={title} summary={`Most common: ${summary}.`}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 12, bottom: 0, left: 0 }}>
        <CartesianGrid stroke={GRID_COLOR} strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" tick={AXIS_STYLE} axisLine={false} tickLine={false} />
        <YAxis
          type="category"
          dataKey="value"
          tick={AXIS_STYLE}
          axisLine={false}
          tickLine={false}
          width={92}
        />
        <Tooltip
          contentStyle={{
            borderRadius: 14,
            border: `1px solid ${GRID_COLOR}`,
            fontSize: 12,
          }}
        />
        <Bar dataKey="count" name="Times logged" fill={color} radius={[0, 8, 8, 0]} />
      </BarChart>
    </ChartFrame>
  );
}
