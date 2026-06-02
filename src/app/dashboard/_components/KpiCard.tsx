import { Info } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface KpiCardProps {
  title: string;
  value: string | number;
  sub?: string;
  tooltip?: string;
  progress?: number;
  icon?: React.ReactNode;
}

export function KpiCard({ title, value, sub, tooltip, progress, icon }: KpiCardProps) {
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-start justify-between gap-2 mb-3">
          {icon && (
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 shrink-0">
              {icon}
            </div>
          )}
          {tooltip && (
            <button
              className="ml-auto text-muted-foreground/50 hover:text-muted-foreground"
              title={tooltip}
              aria-label="More info"
            >
              <Info className="size-3.5" />
            </button>
          )}
        </div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">{title}</p>
        <p className="text-2xl font-semibold tabular-nums tracking-tight">{value}</p>
        {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
        {progress !== undefined && (
          <Progress value={progress} className="mt-3 h-1" />
        )}
      </CardContent>
    </Card>
  );
}
