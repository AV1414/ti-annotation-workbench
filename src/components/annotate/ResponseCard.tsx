'use client';

import { cn } from '@/lib/utils';

interface ResponseCardProps {
  label: string;
  text: string;
  showSource: boolean;
  sourceLabel?: string;
  isSelected?: boolean;
  side?: 'A' | 'B';
  className?: string;
}

export function ResponseCard({ label, text, showSource, sourceLabel, isSelected, side, className }: ResponseCardProps) {
  const accentClass = side === 'A'
    ? 'border-l-4 border-l-[hsl(var(--info))]'
    : side === 'B'
    ? 'border-l-4 border-l-[hsl(var(--purple))]'
    : '';

  const bgClass = side === 'A'
    ? 'bg-[hsl(var(--info-bg))]/30'
    : side === 'B'
    ? 'bg-[hsl(var(--purple-bg))]/30'
    : 'bg-card';

  return (
    <div className={cn(
      'flex-1 rounded-lg border border-border shadow-sm transition-all duration-150',
      bgClass,
      accentClass,
      isSelected && 'ring-2 ring-primary border-primary/40',
      className,
    )}>
      <div className="px-4 pt-3 pb-1">
        <div className="flex items-center justify-between">
          <p className={cn(
            'text-xs font-bold uppercase tracking-widest',
            side === 'A' ? 'text-[hsl(var(--info))]' : side === 'B' ? 'text-[hsl(var(--purple))]' : 'text-muted-foreground',
          )}>
            {label}
          </p>
          {showSource && sourceLabel && (
            <span className="text-[10px] text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">
              {sourceLabel}
            </span>
          )}
        </div>
      </div>
      <div className="px-4 pb-4">
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{text}</p>
      </div>
    </div>
  );
}
