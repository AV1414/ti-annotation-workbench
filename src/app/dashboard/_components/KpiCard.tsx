import { Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface KpiCardProps {
  title: string;
  value: string | number;
  sub?: string;
  tooltip?: string;
  progress?: number; // 0–100
}

export function KpiCard({ title, value, sub, tooltip, progress }: KpiCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-1.5">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          {tooltip && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="text-muted-foreground/60 hover:text-muted-foreground">
                    <Info className="size-3.5" />
                    <span className="sr-only">More info</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-64 text-xs">{tooltip}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-3xl font-bold tracking-tight tabular-nums">{value}</p>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
        {progress !== undefined && (
          <Progress value={progress} className="h-1.5" />
        )}
      </CardContent>
    </Card>
  );
}
