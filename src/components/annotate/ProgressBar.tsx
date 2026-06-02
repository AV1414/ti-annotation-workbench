'use client';

import { cn } from '@/lib/utils';

interface ProgressBarProps {
  current: number;   // uniquePromptsAnnotated
  total: number;     // totalPrompts
  pct?: number;      // pre-computed, capped percentage (use this for the bar)
  className?: string;
  showLabel?: boolean;
  sub?: string;      // e.g. "12 annotations from 3 reviewers"
}

export function ProgressBar({ current, total, pct, className, showLabel = false, sub }: ProgressBarProps) {
  const barPct = pct ?? (total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0);

  return (
    <div className={cn('space-y-1', className)}>
      {showLabel && (
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{current} / {total} prompts annotated</span>
          <span className="tabular-nums">{barPct}%</span>
        </div>
      )}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${barPct}%` }}
        />
      </div>
      {sub && (
        <p className="text-[11px] text-muted-foreground">{sub}</p>
      )}
    </div>
  );
}
