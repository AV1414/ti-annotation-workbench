'use client';

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Annotation, Dimension, RatingChoice, RatingScale, Task } from '@/lib/types';

// ── Color palette for choice buckets ──────────────────────────────────────

// Brand palette: indigo for A-side, violet for B-side, gray for neutral/skip
const COLORS: Record<string, string> = {
  'A (sig. better)':  'oklch(0.457 0.240 281.087)',   /* indigo-700 */
  'A (better)':       'oklch(0.585 0.233 264.376)',   /* indigo-500 */
  'A (slight)':       'oklch(0.723 0.128 264.376)',   /* indigo-300 */
  'Tie':              'oklch(0.708 0 0)',              /* gray-400   */
  'Negligible':       'oklch(0.708 0 0)',
  'B (slight)':       'oklch(0.714 0.203 292.717)',   /* violet-400 */
  'B (better)':       'oklch(0.606 0.250 292.717)',   /* violet-500 */
  'B (sig. better)':  'oklch(0.491 0.270 292.581)',   /* violet-700 */
  'Response A':       'oklch(0.585 0.233 264.376)',   /* indigo-500 */
  'Response B':       'oklch(0.606 0.250 292.717)',   /* violet-500 */
  'Both Bad':         'oklch(0.645 0.246 16.439)',    /* rose-500   */
  'Skip':             'oklch(0.922 0 0)',              /* gray-200   */
};

// ── Bucket definitions per scale ──────────────────────────────────────────

function getBuckets(scale: RatingScale, customScale?: string[]): string[] {
  switch (scale) {
    case 'binary':
      return ['Response A', 'Response B', 'Tie', 'Both Bad', 'Skip'];
    case 'four_point':
    case 'likert_7':
      return ['A (sig. better)', 'A (better)', 'A (slight)', 'Tie', 'B (slight)', 'B (better)', 'B (sig. better)', 'Both Bad', 'Skip'];
    case 'custom':
      return [...(customScale ?? ['A', 'B']), 'Both Bad', 'Skip'];
  }
}

function ratingToBucket(rating: RatingChoice, scale: RatingScale): string {
  const { choice, strength } = rating;
  if (choice === 'both_bad') return 'Both Bad';
  if (choice === 'skip')     return 'Skip';
  if (choice === 'tie')      return scale === 'four_point' || scale === 'likert_7' ? 'Tie' : 'Tie';
  if (scale === 'binary')    return `Response ${choice}`;

  const s = strength;
  if (!s || s === 'negligibly') return 'Tie';
  if (s === 'slightly')         return `${choice} (slight)`;
  if (s === 'better')           return `${choice} (better)`;
  if (s === 'significantly')    return `${choice} (sig. better)`;
  return `Response ${choice}`;
}

// ── Single dimension card ─────────────────────────────────────────────────

interface DimCardProps {
  dimension: Dimension;
  ratings: RatingChoice[];
  task: Task;
}

function DimCard({ dimension, ratings, task }: DimCardProps) {
  const buckets = getBuckets(task.ratingScale, task.customScale);
  const counts: Record<string, number> = Object.fromEntries(buckets.map((b) => [b, 0]));

  for (const r of ratings) {
    const bucket = ratingToBucket(r, task.ratingScale);
    if (counts[bucket] !== undefined) counts[bucket]++;
  }

  const total = ratings.length;
  const chartData = buckets
    .map((b) => ({ label: b, count: counts[b], pct: total > 0 ? Math.round((counts[b] / total) * 100) : 0 }))
    .filter((d) => task.ratingScale !== 'binary' || d.count > 0 || ['Response A', 'Response B', 'Tie'].includes(d.label));

  const aWins = ratings.filter((r) => r.choice === 'A').length;
  const bWins = ratings.filter((r) => r.choice === 'B').length;
  const ties  = ratings.filter((r) => r.choice === 'tie').length;

  return (
    <Card>
      <CardHeader className="pb-0">
        <CardTitle className="text-sm font-semibold">{dimension.label}</CardTitle>
        {dimension.description && (
          <p className="text-xs text-muted-foreground">{dimension.description}</p>
        )}
      </CardHeader>
      <CardContent className="pt-3 space-y-4">
        {total === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">No annotations for this dimension yet.</p>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={chartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: 'hsl(0 0% 50%)' }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: 'hsl(0 0% 50%)' }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: '8px', border: '1px solid hsl(0 0% 90%)' }}
                  formatter={(v, _, entry) => [`${v} (${(entry as { payload: { pct: number } }).payload.pct}%)`, 'Count']}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={COLORS[entry.label] ?? '#94a3b8'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <p className="font-medium tabular-nums">{total > 0 ? Math.round((aWins / total) * 100) : 0}%</p>
                <p className="text-muted-foreground">A preferred<br /><span className="tabular-nums">(n={aWins})</span></p>
              </div>
              <div>
                <p className="font-medium tabular-nums">{total > 0 ? Math.round((ties / total) * 100) : 0}%</p>
                <p className="text-muted-foreground">Tie<br /><span className="tabular-nums">(n={ties})</span></p>
              </div>
              <div>
                <p className="font-medium tabular-nums">{total > 0 ? Math.round((bWins / total) * 100) : 0}%</p>
                <p className="text-muted-foreground">B preferred<br /><span className="tabular-nums">(n={bWins})</span></p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ── Public component ──────────────────────────────────────────────────────

interface DimensionBreakdownProps {
  task: Task;
  annotations: Annotation[];
}

export function DimensionBreakdown({ task, annotations }: DimensionBreakdownProps) {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      {task.dimensions.map((dim) => {
        const ratings = annotations.flatMap((a) =>
          a.ratings.filter((r) => r.dimensionId === dim.id)
        );
        return <DimCard key={dim.id} dimension={dim} ratings={ratings} task={task} />;
      })}
    </div>
  );
}
