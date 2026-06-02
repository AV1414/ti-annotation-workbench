import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProgressBar } from './ProgressBar';
import type { Task, TaskProgress } from '@/lib/types';

const TYPE_COLORS: Record<Task['taskType'], string> = {
  preference: 'bg-brand-primary-subtle text-indigo-700',
  red_teaming: 'bg-brand-danger-subtle text-rose-700',
  rating: 'bg-brand-info-subtle text-sky-700',
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

const METHODOLOGY_VARIANT: Partial<Record<Task['ratingScale'], 'info' | 'purple'>> = {
  binary: 'info',
  four_point: 'purple',
};

interface TaskCardProps {
  task: Task;
  progress: TaskProgress;
}

export function TaskCard({ task, progress }: TaskCardProps) {
  const methodologyVariant = METHODOLOGY_VARIANT[task.ratingScale];

  return (
    <Card className="flex flex-col transition-all hover:shadow-md hover:border-primary/20">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base leading-snug">{task.name}</CardTitle>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-1">
          {/* Methodology badge first — the platform story */}
          {methodologyVariant && METHODOLOGY_LABEL[task.ratingScale] && (
            <Badge variant={methodologyVariant} className="text-[11px]">
              {METHODOLOGY_LABEL[task.ratingScale]}
            </Badge>
          )}
          <span className={`inline-flex h-5 items-center rounded-full px-2 text-[11px] font-medium ${TYPE_COLORS[task.taskType]}`}>
            {TYPE_LABELS[task.taskType]}
          </span>
          <Badge variant="secondary" className="text-[11px]">
            {SCALE_LABELS[task.ratingScale]}
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
          current={progress.uniquePromptsAnnotated}
          total={progress.totalPrompts}
          pct={progress.completionPct}
          showLabel
          sub={
            progress.totalAnnotations > 0
              ? `${progress.totalAnnotations} annotation${progress.totalAnnotations !== 1 ? 's' : ''} from ${progress.uniqueAnnotators} reviewer${progress.uniqueAnnotators !== 1 ? 's' : ''}`
              : undefined
          }
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
