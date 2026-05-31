'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ResponseCardProps {
  label: string;
  text: string;
  showSource: boolean;
  sourceLabel?: string;
  isSelected?: boolean;
  className?: string;
}

export function ResponseCard({ label, text, showSource, sourceLabel, isSelected, className }: ResponseCardProps) {
  return (
    <Card className={cn(
      'flex-1 transition-all duration-150',
      isSelected && 'ring-2 ring-primary border-primary/50',
      className,
    )}>
      <CardHeader className="pb-0">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
          {showSource && sourceLabel && (
            <span className="text-[10px] text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">
              {sourceLabel}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{text}</p>
      </CardContent>
    </Card>
  );
}
