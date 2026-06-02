'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

interface DayCount {
  date: string;
  count: number;
}

interface ActivityChartProps {
  data: DayCount[];
}

export function ActivityChart({ data }: ActivityChartProps) {
  const hasData = data.some((d) => d.count > 0);

  if (!hasData) {
    return (
      <div className="flex h-[200px] items-center justify-center rounded-lg border border-dashed">
        <p className="text-sm text-muted-foreground">No annotations yet — submit some from the Annotate tab to see activity here.</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 90%)" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: 'hsl(0 0% 50%)' }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: 'hsl(0 0% 50%)' }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            borderRadius: '8px',
            border: '1px solid hsl(0 0% 90%)',
            fontSize: '12px',
          }}
          formatter={(v) => [v, 'Annotations']}
        />
        <Line
          type="monotone"
          dataKey="count"
          stroke="oklch(0.585 0.233 264.376)"
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 4, fill: 'oklch(0.585 0.233 264.376)' }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
