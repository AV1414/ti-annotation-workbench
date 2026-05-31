'use client';

import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import type { Task, TaskProgress } from '@/lib/types';

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return `${Math.floor(d / 30)}mo ago`;
}

const TYPE_LABELS: Record<Task['taskType'], string> = {
  preference: 'Preference',
  red_teaming: 'Red Teaming',
  rating: 'Rating',
};

const SCALE_LABELS: Record<Task['ratingScale'], string> = {
  binary: 'Binary',
  four_point: '4-point',
  likert_7: 'Likert 7',
  custom: 'Custom',
};

const STATUS_VARIANT: Record<Task['status'], 'outline' | 'secondary' | 'default'> = {
  draft: 'outline',
  active: 'default',
  completed: 'secondary',
};

interface DashboardTaskTableProps {
  tasks: Task[];
  progressMap: Record<string, TaskProgress>;
}

export function DashboardTaskTable({ tasks, progressMap }: DashboardTaskTableProps) {
  const router = useRouter();

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Task</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Scale</TableHead>
            <TableHead>Dimensions</TableHead>
            <TableHead className="text-center">Prompts</TableHead>
            <TableHead className="text-center">Annotations</TableHead>
            <TableHead>Completion</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => {
            const progress = progressMap[task.id] ?? {
              totalPrompts: task.prompts.length,
              annotationsCount: 0,
              completionPct: 0,
              uniqueAnnotators: 0,
            };

            return (
              <TableRow
                key={task.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => router.push(`/dashboard/${task.id}`)}
              >
                <TableCell>
                  <div>
                    <p className="font-medium text-sm">{task.name}</p>
                    {task.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 max-w-[200px] truncate">
                        {task.description}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{TYPE_LABELS[task.taskType]}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{SCALE_LABELS[task.ratingScale]}</Badge>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {task.dimensions.map((d) => d.label).join(', ')}
                  </span>
                </TableCell>
                <TableCell className="text-center tabular-nums">{task.prompts.length}</TableCell>
                <TableCell className="text-center tabular-nums">{progress.annotationsCount}</TableCell>
                <TableCell>
                  <div className="space-y-1 min-w-[120px]">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{progress.annotationsCount} / {progress.totalPrompts}</span>
                      <span>{progress.completionPct}%</span>
                    </div>
                    <Progress value={progress.completionPct} className="h-1.5" />
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[task.status]} className="capitalize">
                    {task.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                  {relativeTime(task.createdAt)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
