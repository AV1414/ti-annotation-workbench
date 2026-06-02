'use client';

import {
  AreaChart,
  Area,
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

const INDIGO = 'hsl(243 75% 58%)';

export function ActivityChart({ data }: ActivityChartProps) {
  const hasData = data.some((d) => d.count > 0);

  if (!hasData) {
    return (
      <div className="flex h-[180px] items-center justify-center rounded-lg border border-dashed border-border">
        <p className="text-sm text-muted-foreground">No annotation activity yet.</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
        <defs>
          <linearGradient id="indigoGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={INDIGO} stopOpacity={0.25} />
            <stop offset="100%" stopColor={INDIGO} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 6% 93%)" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: 'hsl(240 5% 50%)' }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: 'hsl(240 5% 50%)' }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            borderRadius: '6px',
            border: '1px solid hsl(240 6% 90%)',
            fontSize: '12px',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)',
          }}
          formatter={(v) => [v, 'Annotations']}
        />
        <Area
          type="monotone"
          dataKey="count"
          stroke={INDIGO}
          strokeWidth={2}
          fill="url(#indigoGradient)"
          dot={false}
          activeDot={{ r: 4, fill: INDIGO, strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
