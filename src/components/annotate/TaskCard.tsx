import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProgressBar } from './ProgressBar';
import type { Task, TaskProgress } from '@/lib/types';

const TYPE_COLORS: Record<Task['taskType'], string> = {
  preference: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  red_teaming: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  rating: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
};

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

const METHODOLOGY_LABEL: Partial<Record<Task['ratingScale'], string>> = {
  binary: 'Anthropic-style',
  four_point: 'Meta-style',
};

interface TaskCardProps {
  task: Task;
  progress: TaskProgress;
}

export function TaskCard({ task, progress }: TaskCardProps) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base leading-snug">{task.name}</CardTitle>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-1">
          <span className={`inline-flex h-5 items-center rounded-full px-2 text-[11px] font-medium ${TYPE_COLORS[task.taskType]}`}>
            {TYPE_LABELS[task.taskType]}
          </span>
          <Badge variant="secondary" className="text-[11px]">
            {SCALE_LABELS[task.ratingScale]}
            {METHODOLOGY_LABEL[task.ratingScale] && (
              <span className="ml-1 opacity-60">({METHODOLOGY_LABEL[task.ratingScale]})</span>
            )}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-3">
        {task.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
        )}

        <div className="flex flex-wrap gap-1">
          {task.dimensions.map((d) => (
            <Badge key={d.id} variant="outline" className="text-[10px]">{d.label}</Badge>
          ))}
        </div>

        <ProgressBar
          current={progress.annotationsCount}
          total={progress.totalPrompts}
          showLabel
        />

        <Button asChild className="mt-auto w-full">
          <Link href={`/annotate/${task.id}`}>
            Start Annotating <ArrowRight className="size-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
